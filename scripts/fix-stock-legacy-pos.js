require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function fixLegacyPOs() {
  try {
    console.log('🔄 Processing legacy purchase orders (from purchase_orders table)...\n')
    
    // Get legacy purchase orders (those with product_name in the main table)
    const legacyPOs = await pool.query(`
      SELECT 
        id,
        product_name,
        fabric_type,
        quantity,
        supplier_name,
        date
      FROM purchase_orders
      WHERE product_name IS NOT NULL 
        AND product_name != ''
        AND quantity IS NOT NULL
        AND quantity > 0
        AND NOT EXISTS (
          SELECT 1 FROM purchase_order_items poi 
          WHERE poi.purchase_order_id = purchase_orders.id
        )
      ORDER BY date ASC
    `)
    
    console.log(`Found ${legacyPOs.rows.length} legacy purchase orders\n`)
    
    let matched = 0
    let unmatched = 0
    
    for (const po of legacyPOs.rows) {
      const productName = (po.product_name || '').trim()
      const fabricType = po.fabric_type || 'standard'
      const quantity = parseInt(po.quantity) || 0
      
      if (!productName || quantity <= 0) continue
      
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
      
      // Strategy 4: Try matching by first few words
      if (inventoryResult.rows.length === 0) {
        const firstWords = productName.toLowerCase().split(/\s+/).slice(0, 2).join(' ')
        if (firstWords.length > 3) {
          inventoryResult = await pool.query(
            `SELECT id, dress_name, dress_code, quantity_in, current_stock 
             FROM inventory 
             WHERE LOWER(dress_name) LIKE $1 
             LIMIT 1`,
            [`${firstWords}%`]
          )
        }
      }
      
      // Strategy 5: Try normalized matching (remove special chars)
      if (inventoryResult.rows.length === 0) {
        const normalizedPO = productName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        const allInventory = await pool.query(
          'SELECT id, dress_name, dress_code, quantity_in, current_stock FROM inventory'
        )
        
        for (const inv of allInventory.rows) {
          const normalizedInv = inv.dress_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
          if (normalizedPO === normalizedInv || 
              (normalizedPO.length > 5 && normalizedInv.length > 5 && 
               (normalizedPO.includes(normalizedInv) || normalizedInv.includes(normalizedPO)))) {
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
        
        console.log(`✅ PO-${po.id}: "${productName}" → "${inventory.dress_name}" (+${quantity}, Stock: ${newCurrentStock})`)
        matched++
      } else {
        console.log(`⚠️  PO-${po.id}: No match for "${productName}" (Qty: ${quantity}, Fabric: ${fabricType})`)
        unmatched++
      }
    }
    
    console.log(`\n✅ Legacy PO processing completed!`)
    console.log(`   Matched: ${matched}, Unmatched: ${unmatched}`)
    
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

fixLegacyPOs()

