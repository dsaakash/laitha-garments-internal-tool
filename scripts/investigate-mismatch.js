const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function investigateMismatch() {
  const client = await pool.connect()
  try {
    // Check all purchase orders for SAREE MUL COTTON
    console.log('🔍 Investigating SAREE MUL COTTON mismatch...\n')
    
    const poResult = await client.query(`
      SELECT poi.*, po.date, po.id as po_id
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.purchase_order_id = po.id
      WHERE LOWER(poi.product_name) LIKE '%saree%mul%cotton%'
      ORDER BY po.date
    `)
    
    console.log('📦 Purchase Orders:')
    let totalPOQuantity = 0
    poResult.rows.forEach(row => {
      const qty = parseInt(row.quantity) || 0
      totalPOQuantity += qty
      console.log(`  PO #${row.po_id} on ${row.date}: ${qty} units of "${row.product_name}" (fabric: ${row.fabric_type || 'N/A'})`)
    })
    console.log(`  Total in POs: ${totalPOQuantity} units\n`)
    
    // Check all inventory items
    const invResult = await client.query(`
      SELECT id, dress_name, dress_code, quantity_in, quantity_out, current_stock, fabric_type
      FROM inventory
      WHERE LOWER(dress_name) LIKE '%saree%mul%cotton%'
      ORDER BY id
    `)
    
    console.log('📋 Inventory Items:')
    invResult.rows.forEach(row => {
      console.log(`  ID ${row.id}: "${row.dress_name}"`)
      console.log(`    Dress Code: ${row.dress_code}`)
      console.log(`    Fabric Type: ${row.fabric_type || 'N/A'}`)
      console.log(`    quantity_in: ${row.quantity_in}, quantity_out: ${row.quantity_out}, current_stock: ${row.current_stock}`)
    })
    
    // Check why products aren't being created
    console.log('\n🔍 Checking products not in inventory...\n')
    
    const notInInv = await client.query(`
      SELECT DISTINCT poi.product_name, poi.fabric_type, SUM(poi.quantity) as total_qty
      FROM purchase_order_items poi
      LEFT JOIN inventory inv ON (
        inv.dress_code = UPPER(REPLACE(REPLACE(poi.product_name || '_' || COALESCE(poi.fabric_type, 'standard'), ' ', '_'), '  ', '_'))
        OR LOWER(TRIM(inv.dress_name)) = LOWER(TRIM(poi.product_name))
      )
      WHERE inv.id IS NULL
      GROUP BY poi.product_name, poi.fabric_type
    `)
    
    if (notInInv.rows.length > 0) {
      console.log('⚠️  Products in POs but not in inventory:')
      notInInv.rows.forEach(row => {
        const expectedCode = `${row.product_name}_${row.fabric_type || 'standard'}`.replace(/\s+/g, '_').toUpperCase()
        console.log(`  "${row.product_name}" (${row.fabric_type || 'N/A'}) - ${row.total_qty} units`)
        console.log(`    Expected dress_code: ${expectedCode}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

investigateMismatch()
