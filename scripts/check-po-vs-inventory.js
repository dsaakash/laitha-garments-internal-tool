const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function checkPOVsInventory() {
  console.log('🔍 Checking Purchase Orders vs Inventory Stock...\n')
  
  const client = await pool.connect()
  try {
    // Get all purchase order items grouped by product
    const poItemsResult = await client.query(`
      SELECT 
        poi.product_name,
        poi.fabric_type,
        SUM(poi.quantity) as total_quantity,
        COUNT(DISTINCT poi.purchase_order_id) as po_count,
        STRING_AGG(DISTINCT po.date::text, ', ' ORDER BY po.date::text) as po_dates
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.purchase_order_id = po.id
      GROUP BY poi.product_name, poi.fabric_type
      ORDER BY poi.product_name, poi.fabric_type
    `)
    
    console.log(`📦 Found ${poItemsResult.rows.length} unique products in purchase orders\n`)
    console.log('='.repeat(100))
    console.log('PURCHASE ORDERS SUMMARY')
    console.log('='.repeat(100))
    
    // Get all inventory items
    const inventoryResult = await client.query(`
      SELECT 
        id,
        dress_name,
        dress_code,
        fabric_type,
        quantity_in,
        quantity_out,
        current_stock
      FROM inventory
      ORDER BY dress_name, fabric_type
    `)
    
    console.log(`📋 Found ${inventoryResult.rows.length} inventory items\n`)
    
    let matched = 0
    let mismatched = 0
    let notInInventory = 0
    
    // Compare each PO item with inventory
    for (const poItem of poItemsResult.rows) {
      const productName = poItem.product_name.trim()
      const fabricType = poItem.fabric_type || 'standard'
      const expectedQuantityIn = parseInt(poItem.total_quantity) || 0
      const dressCode = `${productName}_${fabricType}`.replace(/\s+/g, '_').toUpperCase()
      
      // Try to find matching inventory item
      let inventoryMatch = await client.query(
        'SELECT * FROM inventory WHERE dress_code = $1',
        [dressCode]
      )
      
      // If no exact match, try fuzzy match
      if (inventoryMatch.rows.length === 0) {
        inventoryMatch = await client.query(
          `SELECT * FROM inventory 
           WHERE LOWER(TRIM(dress_name)) = LOWER(TRIM($1))
           LIMIT 1`,
          [productName]
        )
      }
      
      if (inventoryMatch.rows.length > 0) {
        const inventory = inventoryMatch.rows[0]
        const actualQuantityIn = parseInt(inventory.quantity_in) || 0
        const actualQuantityOut = parseInt(inventory.quantity_out) || 0
        const actualStock = parseInt(inventory.current_stock) || 0
        
        if (actualQuantityIn === expectedQuantityIn) {
          matched++
          console.log(`✅ MATCH: ${productName} (${fabricType})`)
          console.log(`   PO Quantity: ${expectedQuantityIn} | Inventory quantity_in: ${actualQuantityIn} | Stock: ${actualStock} | Sold: ${actualQuantityOut}`)
        } else {
          mismatched++
          console.log(`\n❌ MISMATCH: ${productName} (${fabricType})`)
          console.log(`   📦 Purchase Orders: ${expectedQuantityIn} units (from ${poItem.po_count} PO(s) on ${poItem.po_dates})`)
          console.log(`   📋 Inventory: quantity_in=${actualQuantityIn}, quantity_out=${actualQuantityOut}, current_stock=${actualStock}`)
          console.log(`   ⚠️  Difference: ${expectedQuantityIn - actualQuantityIn} units`)
          console.log(`   🔍 Inventory ID: ${inventory.id}, Dress Code: ${inventory.dress_code}`)
        }
      } else {
        notInInventory++
        console.log(`\n⚠️  NOT IN INVENTORY: ${productName} (${fabricType})`)
        console.log(`   📦 Purchase Orders: ${expectedQuantityIn} units (from ${poItem.po_count} PO(s) on ${poItem.po_dates})`)
        console.log(`   📋 Expected dress_code: ${dressCode}`)
        console.log(`   ⚠️  This product exists in purchase orders but not in inventory!`)
      }
    }
    
    // Show inventory items that don't have matching purchase orders
    console.log('\n' + '='.repeat(100))
    console.log('INVENTORY ITEMS WITHOUT PURCHASE ORDERS')
    console.log('='.repeat(100))
    
    let inventoryWithoutPO = 0
    for (const inventory of inventoryResult.rows) {
      const dressCode = inventory.dress_code
      const productName = inventory.dress_name.trim()
      
      // Check if this inventory item has any purchase orders
      const poCheck = await client.query(
        `SELECT COUNT(*) as count
         FROM purchase_order_items poi
         WHERE poi.product_name = $1 
           OR poi.fabric_type = $2
           OR LOWER(TRIM(poi.product_name)) = LOWER(TRIM($3))`,
        [productName, inventory.fabric_type, productName]
      )
      
      const hasPO = parseInt(poCheck.rows[0].count) > 0
      
      if (!hasPO && (parseInt(inventory.quantity_in) || 0) > 0) {
        inventoryWithoutPO++
        console.log(`\n⚠️  ${inventory.dress_name} (${inventory.fabric_type || 'N/A'})`)
        console.log(`   📋 Inventory: quantity_in=${inventory.quantity_in}, stock=${inventory.current_stock}`)
        console.log(`   ⚠️  No matching purchase orders found`)
      }
    }
    
    if (inventoryWithoutPO === 0) {
      console.log('   ✅ All inventory items with stock have matching purchase orders')
    }
    
    // Summary
    console.log('\n' + '='.repeat(100))
    console.log('SUMMARY')
    console.log('='.repeat(100))
    console.log(`📦 Products in Purchase Orders: ${poItemsResult.rows.length}`)
    console.log(`✅ Matched correctly: ${matched}`)
    console.log(`❌ Mismatched: ${mismatched}`)
    console.log(`⚠️  Not in inventory: ${notInInventory}`)
    console.log(`📋 Inventory items without POs: ${inventoryWithoutPO}`)
    
    if (mismatched > 0 || notInInventory > 0) {
      console.log(`\n💡 Run 'npm run reconcile-stock-pos' to fix mismatches`)
    } else {
      console.log(`\n✅ All purchase order quantities match inventory stock!`)
    }
    
  } catch (error) {
    console.error('❌ Error checking PO vs Inventory:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

checkPOVsInventory()
