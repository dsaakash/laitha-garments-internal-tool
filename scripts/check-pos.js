require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function checkPOs() {
  try {
    const poResult = await pool.query(`
      SELECT COUNT(*) as count FROM purchase_orders
    `)
    console.log(`Total Purchase Orders: ${poResult.rows[0].count}`)
    
    const poiResult = await pool.query(`
      SELECT COUNT(*) as count FROM purchase_order_items
    `)
    console.log(`Total Purchase Order Items: ${poiResult.rows[0].count}`)
    
    const itemsResult = await pool.query(`
      SELECT 
        poi.product_name,
        poi.quantity,
        poi.fabric_type,
        po.date,
        po.supplier_name
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.purchase_order_id = po.id
      ORDER BY po.date DESC
      LIMIT 20
    `)
    
    console.log('\nRecent Purchase Order Items:')
    itemsResult.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.product_name} (Qty: ${row.quantity}, Fabric: ${row.fabric_type || 'N/A'}) - ${row.supplier_name} - ${row.date}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

checkPOs()

