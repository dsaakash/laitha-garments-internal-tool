const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

// Normalize product name for matching (remove extra spaces, trim, lowercase)
function normalizeProductName(name) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

async function fixPOMatching() {
  console.log('🔧 Fixing Purchase Order to Inventory Matching...\n')
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // Step 1: Get all purchase order items
    const poItemsResult = await client.query(`
      SELECT 
        poi.id,
        poi.purchase_order_id,
        poi.product_name,
        poi.fabric_type,
        poi.quantity,
        po.date
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.purchase_order_id = po.id
      ORDER BY po.date, poi.id
    `)
    
    console.log(`Found ${poItemsResult.rows.length} purchase order items\n`)
    
    // Step 2: Group by normalized product name and fabric type
    const poGroups = new Map()
    for (const poi of poItemsResult.rows) {
      const normalizedName = normalizeProductName(poi.product_name)
      const fabricType = (poi.fabric_type || 'standard').trim()
      const key = `${normalizedName}_${fabricType.toLowerCase()}`
      
      if (!poGroups.has(key)) {
        poGroups.set(key, {
          productName: poi.product_name.trim(), // Use first occurrence as canonical name
          fabricType: fabricType,
          totalQuantity: 0,
          items: []
        })
      }
      
      const group = poGroups.get(key)
      group.totalQuantity += parseInt(poi.quantity) || 0
      group.items.push(poi)
    }
    
    console.log(`Grouped into ${poGroups.size} unique products\n`)
    
    let created = 0
    let updated = 0
    let matched = 0
    
    // Step 3: For each group, find or create inventory item
    for (const [key, group] of poGroups.entries()) {
      const dressCode = `${group.productName}_${group.fabricType}`.replace(/\s+/g, '_').toUpperCase()
      
      // Try to find existing inventory item
      let inventoryMatch = await client.query(
        'SELECT * FROM inventory WHERE dress_code = $1',
        [dressCode]
      )
      
      // If no exact match, try normalized name match
      if (inventoryMatch.rows.length === 0) {
        const normalizedName = normalizeProductName(group.productName)
        inventoryMatch = await client.query(
          `SELECT * FROM inventory 
           WHERE LOWER(TRIM(REPLACE(dress_name, '  ', ' '))) = $1
           AND (fabric_type = $2 OR (fabric_type IS NULL AND $2 = 'standard'))
           LIMIT 1`,
          [normalizedName, group.fabricType]
        )
      }
      
      if (inventoryMatch.rows.length > 0) {
        // Update existing inventory
        const inventory = inventoryMatch.rows[0]
        const currentQuantityIn = parseInt(inventory.quantity_in) || 0
        const currentQuantityOut = parseInt(inventory.quantity_out) || 0
        
        if (currentQuantityIn !== group.totalQuantity) {
          const newCurrentStock = group.totalQuantity - currentQuantityOut
          
          // Update dress_code if it doesn't match (normalize it)
          if (inventory.dress_code !== dressCode) {
            await client.query(
              `UPDATE inventory 
               SET dress_code = $1,
                   quantity_in = $2,
                   current_stock = $3,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $4`,
              [dressCode, group.totalQuantity, newCurrentStock, inventory.id]
            )
            console.log(`✅ Updated: ${group.productName} (${group.fabricType})`)
            console.log(`   Dress code: ${inventory.dress_code} → ${dressCode}`)
            console.log(`   Stock: ${currentQuantityIn} → ${group.totalQuantity}`)
            updated++
          } else {
            await client.query(
              `UPDATE inventory 
               SET quantity_in = $1,
                   current_stock = $2,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $3`,
              [group.totalQuantity, newCurrentStock, inventory.id]
            )
            console.log(`✅ Updated: ${group.productName} (${group.fabricType})`)
            console.log(`   Stock: ${currentQuantityIn} → ${group.totalQuantity}`)
            updated++
          }
        } else {
          matched++
        }
      } else {
        // Create new inventory item
        // Get price from first PO item
        const firstItem = group.items[0]
        const pricePerPiece = parseFloat(firstItem.price_per_piece) || 0
        
        // Get sizes from first PO item if available
        const sizes = firstItem.sizes && Array.isArray(firstItem.sizes) ? firstItem.sizes : []
        
        await client.query(
          `INSERT INTO inventory 
           (dress_name, dress_type, dress_code, sizes, fabric_type, 
            wholesale_price, selling_price, quantity_in, quantity_out, current_stock)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            group.productName,
            'Custom',
            dressCode,
            sizes,
            group.fabricType,
            pricePerPiece,
            (pricePerPiece * 2).toFixed(2),
            group.totalQuantity,
            0,
            group.totalQuantity
          ]
        )
        
        console.log(`✅ Created: ${group.productName} (${group.fabricType})`)
        console.log(`   Dress code: ${dressCode}`)
        console.log(`   Stock: ${group.totalQuantity}`)
        created++
      }
    }
    
    await client.query('COMMIT')
    
    console.log(`\n📊 Summary:`)
    console.log(`   Purchase order items processed: ${poItemsResult.rows.length}`)
    console.log(`   Unique products: ${poGroups.size}`)
    console.log(`   Already matched: ${matched}`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Created: ${created}`)
    
    if (created > 0 || updated > 0) {
      console.log(`\n✅ Fixed ${created + updated} inventory item(s)!`)
    } else {
      console.log(`\n✅ All inventory items match purchase orders!`)
    }
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error fixing matching:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

fixPOMatching()
