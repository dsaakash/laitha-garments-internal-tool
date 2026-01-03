require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function fixRemaining() {
  try {
    // Fix "Cod set 3 PC" -> "Cot set 3 PC" (typo)
    const codPO = await pool.query(`
      SELECT id, quantity FROM purchase_orders 
      WHERE product_name LIKE '%Cod set%' OR product_name LIKE '%cod set%'
    `)
    
    if (codPO.rows.length > 0) {
      const po = codPO.rows[0]
      const quantity = parseInt(po.quantity) || 0
      
      const inventory = await pool.query(
        "SELECT id, quantity_in, current_stock FROM inventory WHERE LOWER(dress_name) LIKE '%cot set%'"
      )
      
      if (inventory.rows.length > 0) {
        const inv = inventory.rows[0]
        const newQuantityIn = (parseInt(inv.quantity_in) || 0) + quantity
        const newCurrentStock = (parseInt(inv.current_stock) || 0) + quantity
        
        await pool.query(
          `UPDATE inventory 
           SET quantity_in = $1, current_stock = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [newQuantityIn, newCurrentStock, inv.id]
        )
        
        console.log(`✅ Fixed "Cod set 3 PC" → "Cot set 3 PC" (+${quantity})`)
      }
    }
    
    // Fix "Dress Material fabric" -> "drees fabric" (typo)
    const materialPO = await pool.query(`
      SELECT id, quantity FROM purchase_orders 
      WHERE product_name LIKE '%Dress Material%' OR product_name LIKE '%dress material%'
    `)
    
    if (materialPO.rows.length > 0) {
      const po = materialPO.rows[0]
      const quantity = parseInt(po.quantity) || 0
      
      const inventory = await pool.query(
        `SELECT id, quantity_in, current_stock FROM inventory 
         WHERE LOWER(dress_name) LIKE '%drees fabric%' 
         OR LOWER(dress_name) LIKE '%dress fabric%'`
      )
      
      if (inventory.rows.length > 0) {
        const inv = inventory.rows[0]
        const newQuantityIn = (parseInt(inv.quantity_in) || 0) + quantity
        const newCurrentStock = (parseInt(inv.current_stock) || 0) + quantity
        
        await pool.query(
          `UPDATE inventory 
           SET quantity_in = $1, current_stock = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [newQuantityIn, newCurrentStock, inv.id]
        )
        
        console.log(`✅ Fixed "Dress Material fabric" → "drees fabric" (+${quantity})`)
      }
    }
    
    console.log('\n✅ Remaining PO fixes completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

fixRemaining()

