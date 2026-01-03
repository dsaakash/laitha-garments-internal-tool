require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function backfillStock() {
  try {
    console.log('🔄 Starting stock backfill from purchase orders...')
    
    // Get all purchase order items
    const purchaseOrderItems = await pool.query(`
      SELECT 
        poi.product_name,
        poi.fabric_type,
        poi.quantity,
        po.supplier_name
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.purchase_order_id = po.id
      ORDER BY po.date ASC
    `)
    
    console.log(`Found ${purchaseOrderItems.rows.length} purchase order items`)
    
    // Process each purchase order item
    for (const item of purchaseOrderItems.rows) {
      const dressCode = `${item.product_name}_${item.fabric_type || 'standard'}`.replace(/\s+/g, '_').toUpperCase()
      
      // Try to find matching inventory item
      const inventoryResult = await pool.query(
        'SELECT id, quantity_in, current_stock, dress_code FROM inventory WHERE dress_code = $1',
        [dressCode]
      )
      
      if (inventoryResult.rows.length > 0) {
        const inventory = inventoryResult.rows[0]
        const currentQuantityIn = parseInt(inventory.quantity_in) || 0
        const currentStock = parseInt(inventory.current_stock) || 0
        const quantity = parseInt(item.quantity) || 0
        
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
        
        console.log(`✅ Updated ${inventory.dress_code}: +${quantity} (Stock: ${newCurrentStock})`)
      } else {
        // Try to find by product name (fuzzy match)
        const fuzzyMatch = await pool.query(
          `SELECT id, quantity_in, current_stock, dress_code, dress_name 
           FROM inventory 
           WHERE LOWER(dress_name) LIKE LOWER($1) 
           OR LOWER(dress_code) LIKE LOWER($2)
           LIMIT 1`,
          [`%${item.product_name.trim()}%`, `%${item.product_name.replace(/\s+/g, '_').toUpperCase()}%`]
        )
        
        if (fuzzyMatch.rows.length > 0) {
          const inventory = fuzzyMatch.rows[0]
          const currentQuantityIn = parseInt(inventory.quantity_in) || 0
          const currentStock = parseInt(inventory.current_stock) || 0
          const quantity = parseInt(item.quantity) || 0
          
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
          
          console.log(`✅ Updated ${inventory.dress_code} (fuzzy match): +${quantity} (Stock: ${newCurrentStock})`)
        } else {
          console.log(`⚠️  No inventory match found for: ${item.product_name} (dress_code: ${dressCode})`)
        }
      }
    }
    
    // Now subtract sales from stock
    console.log('\n🔄 Processing sales to decrease stock...')
    
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
    
    console.log(`Found ${salesItems.rows.length} sale items`)
    
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
      } else if (item.dress_name) {
        inventoryResult = await pool.query(
          'SELECT id, quantity_out, current_stock FROM inventory WHERE LOWER(dress_name) LIKE LOWER($1) LIMIT 1',
          [`%${item.dress_name.trim()}%`]
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
        
        console.log(`✅ Updated stock for sale: -${quantity} (Stock: ${newCurrentStock})`)
      } else {
        console.log(`⚠️  No inventory match found for sale: ${item.dress_name || item.dress_code}`)
      }
    }
    
    console.log('\n✅ Stock backfill completed!')
    
    // Show summary
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity_in) as total_in,
        SUM(quantity_out) as total_out,
        SUM(current_stock) as total_stock
      FROM inventory
    `)
    
    console.log('\n📊 Summary:')
    console.log(`Total Items: ${summary.rows[0].total_items}`)
    console.log(`Total Quantity In: ${summary.rows[0].total_in || 0}`)
    console.log(`Total Quantity Out: ${summary.rows[0].total_out || 0}`)
    console.log(`Total Current Stock: ${summary.rows[0].total_stock || 0}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Backfill failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

backfillStock()

