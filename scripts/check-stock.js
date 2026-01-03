require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function checkStock() {
  try {
    const result = await pool.query(`
      SELECT id, dress_name, dress_code, quantity_in, quantity_out, current_stock 
      FROM inventory 
      ORDER BY current_stock DESC, quantity_in DESC
      LIMIT 20
    `)
    
    console.log('📊 Inventory Stock Status:\n')
    console.log('ID | Dress Name | Dress Code | In | Out | Stock')
    console.log('-'.repeat(80))
    
    result.rows.forEach(row => {
      console.log(`${row.id} | ${row.dress_name.substring(0, 20).padEnd(20)} | ${row.dress_code.substring(0, 15).padEnd(15)} | ${row.quantity_in || 0} | ${row.quantity_out || 0} | ${row.current_stock || 0}`)
    })
    
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(quantity_in) as total_in,
        SUM(quantity_out) as total_out,
        SUM(current_stock) as total_stock,
        COUNT(CASE WHEN current_stock > 0 THEN 1 END) as items_with_stock
      FROM inventory
    `)
    
    console.log('\n📈 Summary:')
    console.log(`Total Items: ${summary.rows[0].total}`)
    console.log(`Items with Stock: ${summary.rows[0].items_with_stock}`)
    console.log(`Total Quantity In: ${summary.rows[0].total_in || 0}`)
    console.log(`Total Quantity Out: ${summary.rows[0].total_out || 0}`)
    console.log(`Total Current Stock: ${summary.rows[0].total_stock || 0}`)
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

checkStock()

