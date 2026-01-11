const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

// Normalize product name for matching
function normalizeProductName(name) {
  return name.trim().replace(/\s+/g, ' ')
}

async function reconcileStockFromPOs() {
  console.log('🔍 Reconciling inventory stock from purchase orders...\n')
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // Step 1: Get all purchase order items
    const poItemsRaw = await client.query(`
      SELECT 
        product_name,
        fabric_type,
        quantity
      FROM purchase_order_items
      ORDER BY product_name, fabric_type
    `)
    
    // Group by normalized name and fabric type
    const poGroups = new Map()
    for (const row of poItemsRaw.rows) {
      const normalizedName = normalizeProductName(row.product_name)
      const fabricType = (row.fabric_type || 'standard').trim()
      const key = `${normalizedName.toLowerCase()}_${fabricType.toLowerCase()}`
      
      if (!poGroups.has(key)) {
        poGroups.set(key, {
          productName: normalizedName, // Use normalized name
          fabricType: fabricType,
          totalQuantity: 0
        })
      }
      
      poGroups.get(key).totalQuantity += parseInt(row.quantity) || 0
    }
    
    const poItems = Array.from(poGroups.values())
    console.log(`Found ${poItems.length} unique products in purchase orders\n`)
    
    // Step 2: Get all inventory items
    const inventoryResult = await client.query(`
      SELECT 
        id,
        dress_name,
        dress_code,
        quantity_in,
        quantity_out,
        current_stock,
        fabric_type
      FROM inventory
      ORDER BY id
    `)
    
    console.log(`Found ${inventoryResult.rows.length} inventory items\n`)
    
    let matched = 0
    let unmatched = 0
    let fixed = 0
    
    // Step 3: For each PO group, find matching inventory and update
    for (const poItem of poItems) {
      const productName = poItem.productName // Already normalized
      const fabricType = poItem.fabricType
      const expectedQuantityIn = parseInt(poItem.totalQuantity) || 0
      const dressCode = `${productName}_${fabricType}`.replace(/\s+/g, '_').toUpperCase()
      
      // Try to find matching inventory item
      let inventoryMatch = await client.query(
        'SELECT * FROM inventory WHERE dress_code = $1',
        [dressCode]
      )
      
      // If no exact match, try normalized name match
      if (inventoryMatch.rows.length === 0) {
        const normalizedNameLower = productName.toLowerCase()
        inventoryMatch = await client.query(
          `SELECT * FROM inventory 
           WHERE LOWER(TRIM(REPLACE(dress_name, '  ', ' '))) = $1
           AND (fabric_type = $2 OR (fabric_type IS NULL AND $2 = 'standard'))
           LIMIT 1`,
          [normalizedNameLower, fabricType]
        )
      }
      
      if (inventoryMatch.rows.length > 0) {
        matched++
        const inventory = inventoryMatch.rows[0]
        const currentQuantityIn = parseInt(inventory.quantity_in) || 0
        const currentQuantityOut = parseInt(inventory.quantity_out) || 0
        const currentStock = parseInt(inventory.current_stock) || 0
        
        // Calculate expected stock
        const expectedStock = expectedQuantityIn - currentQuantityOut
        
        if (currentQuantityIn !== expectedQuantityIn || currentStock !== expectedStock) {
          console.log(`\n⚠️  Mismatch found for: ${productName} (${fabricType})`)
          console.log(`   Current: quantity_in=${currentQuantityIn}, quantity_out=${currentQuantityOut}, current_stock=${currentStock}`)
          console.log(`   Expected: quantity_in=${expectedQuantityIn}, quantity_out=${currentQuantityOut}, current_stock=${expectedStock}`)
          
          // Update to match expected values
          await client.query(`
            UPDATE inventory
            SET quantity_in = $1,
                current_stock = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `, [expectedQuantityIn, expectedStock, inventory.id])
          
          console.log(`   ✅ Fixed: Updated to match purchase orders`)
          fixed++
        }
      } else {
        unmatched++
        console.log(`\n⚠️  No inventory match found for: ${productName} (${fabricType})`)
        console.log(`   Expected quantity_in from POs: ${expectedQuantityIn}`)
        console.log(`   This product exists in purchase orders but not in inventory`)
      }
    }
    
    await client.query('COMMIT')
    
    console.log(`\n📊 Summary:`)
    console.log(`   Products in purchase orders: ${poItems.length}`)
    console.log(`   Matched to inventory: ${matched}`)
    console.log(`   Unmatched (not in inventory): ${unmatched}`)
    console.log(`   Items fixed: ${fixed}`)
    
    if (fixed > 0) {
      console.log(`\n✅ Fixed ${fixed} inventory item(s) to match purchase order quantities.`)
    } else {
      console.log(`\n✅ All inventory items match purchase order quantities.`)
    }
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error reconciling stock:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

reconcileStockFromPOs()
