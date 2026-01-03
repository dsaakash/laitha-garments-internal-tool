require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function fixStockMatching() {
  try {
    console.log('🔄 Fixing stock matching between purchase orders and inventory...\n')
    
    // Get all purchase order items
    const purchaseOrderItems = await pool.query(`
      SELECT 
        poi.id as poi_id,
        poi.product_name,
        poi.fabric_type,
        poi.quantity,
        po.date,
        po.supplier_name
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.purchase_order_id = po.id
      ORDER BY po.date ASC
    `)
    
    console.log(`Found ${purchaseOrderItems.rows.length} purchase order items\n`)
    
    let matched = 0
    let unmatched = 0
    
    for (const poi of purchaseOrderItems.rows) {
      const productName = poi.product_name.trim()
      const fabricType = poi.fabric_type || 'standard'
      const quantity = parseInt(poi.quantity) || 0
      
      if (quantity <= 0) continue
      
      // Strategy 1: Try exact dress_code match
      const dressCode = `${productName}_${fabricType}`.replace(/\s+/g, '_').toUpperCase()
      let inventoryResult = await pool.query(
        'SELECT id, dress_name, dress_code, quantity_in, current_stock FROM inventory WHERE dress_code = $1',
        [dressCode]
      )
      
      // Strategy 2: Try exact product name match (case-insensitive, trimmed)
      if (inventoryResult.rows.length === 0) {
        inventoryResult = await pool.query(
          'SELECT id, dress_name, dress_code, quantity_in, current_stock FROM inventory WHERE LOWER(TRIM(dress_name)) = LOWER(TRIM($1)) LIMIT 1',
          [productName]
        )
      }
      
      // Strategy 3: Try partial name match
      if (inventoryResult.rows.length === 0) {
        const nameWords = productName.toLowerCase().split(/\s+/).filter(w => w.length > 2)
        if (nameWords.length > 0) {
          const searchPattern = `%${nameWords.join('%')}%`
          inventoryResult = await pool.query(
            'SELECT id, dress_name, dress_code, quantity_in, current_stock FROM inventory WHERE LOWER(dress_name) LIKE $1 LIMIT 1',
            [searchPattern]
          )
        }
      }
      
      // Strategy 4: Try matching by removing special characters and spaces
      if (inventoryResult.rows.length === 0) {
        const normalizedPO = productName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        const allInventory = await pool.query(
          'SELECT id, dress_name, dress_code, quantity_in, current_stock FROM inventory'
        )
        
        for (const inv of allInventory.rows) {
          const normalizedInv = inv.dress_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
          if (normalizedPO === normalizedInv || 
              normalizedPO.includes(normalizedInv) || 
              normalizedInv.includes(normalizedPO)) {
            inventoryResult = { rows: [inv] }
            break
          }
        }
      }
      
      if (inventoryResult.rows.length > 0) {
        const inventory = inventoryResult.rows[0]
        const currentQuantityIn = parseInt(inventory.quantity_in) || 0
        const currentStock = parseInt(inventory.current_stock) || 0
        const newQuantityIn = currentQuantityIn + quantity
        const newCurrentStock = currentStock + quantity
        
        await pool.query(
          `UPDATE inventory 
           SET quantity_in = $1, 
               current_stock = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [newQuantityIn, newCurrentStock, inventory.id]
        )
        
        console.log(`✅ Matched: "${productName}" → "${inventory.dress_name}" (+${quantity}, Stock: ${newCurrentStock})`)
        matched++
      } else {
        console.log(`⚠️  No match found for: "${productName}" (Qty: ${quantity})`)
        unmatched++
      }
    }
    
    // Now process sales to decrease stock
    console.log('\n🔄 Processing sales to decrease stock...\n')
    
    const salesItems = await pool.query(`
      SELECT 
        si.dress_code,
        si.dress_name,
        si.quantity,
        si.inventory_id
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      ORDER BY s.date ASC
    `)
    
    let salesMatched = 0
    let salesUnmatched = 0
    
    for (const item of salesItems.rows) {
      let inventoryResult
      
      if (item.inventory_id) {
        inventoryResult = await pool.query(
          'SELECT id, quantity_out, current_stock FROM inventory WHERE id = $1',
          [item.inventory_id]
        )
      } else if (item.dress_code) {
        inventoryResult = await pool.query(
          'SELECT id, quantity_out, current_stock FROM inventory WHERE dress_code = $1',
          [item.dress_code]
        )
      }
      
      if (!inventoryResult || inventoryResult.rows.length === 0) {
        // Try name match
        inventoryResult = await pool.query(
          'SELECT id, quantity_out, current_stock FROM inventory WHERE LOWER(TRIM(dress_name)) = LOWER(TRIM($1)) LIMIT 1',
          [item.dress_name]
        )
      }
      
      if (inventoryResult && inventoryResult.rows.length > 0) {
        const inventory = inventoryResult.rows[0]
        const currentQuantityOut = parseInt(inventory.quantity_out) || 0
        const currentStock = parseInt(inventory.current_stock) || 0
        const quantity = parseInt(item.quantity) || 0
        
        const newQuantityOut = currentQuantityOut + quantity
        const newCurrentStock = Math.max(0, currentStock - quantity)
        
        await pool.query(
          `UPDATE inventory 
           SET quantity_out = $1, 
               current_stock = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [newQuantityOut, newCurrentStock, inventory.id]
        )
        
        salesMatched++
      } else {
        salesUnmatched++
      }
    }
    
    console.log(`\n✅ Stock matching completed!`)
    console.log(`   Purchase Orders: ${matched} matched, ${unmatched} unmatched`)
    console.log(`   Sales: ${salesMatched} matched, ${salesUnmatched} unmatched`)
    
    // Show summary
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity_in) as total_in,
        SUM(quantity_out) as total_out,
        SUM(current_stock) as total_stock,
        COUNT(CASE WHEN current_stock > 0 THEN 1 END) as items_with_stock
      FROM inventory
    `)
    
    console.log('\n📊 Final Summary:')
    console.log(`Total Items: ${summary.rows[0].total_items}`)
    console.log(`Items with Stock: ${summary.rows[0].items_with_stock}`)
    console.log(`Total Quantity In: ${summary.rows[0].total_in || 0}`)
    console.log(`Total Quantity Out: ${summary.rows[0].total_out || 0}`)
    console.log(`Total Current Stock: ${summary.rows[0].total_stock || 0}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

fixStockMatching()

