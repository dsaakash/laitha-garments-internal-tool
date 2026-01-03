require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
})

async function test() {
  const client = await pool.connect()
  
  try {
    console.log('Testing purchase orders query...')
    
    // Check if columns exist
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_orders' 
      AND column_name IN ('subtotal', 'gst_amount', 'grand_total', 'custom_po_number', 'invoice_image')
    `)
    
    console.log('Columns found:', columnCheck.rows.map(r => r.column_name))
    
    // Test the query
    const result = await client.query(`
      SELECT 
        po.id,
        po.date,
        po.supplier_id,
        po.supplier_name,
        po.custom_po_number,
        po.invoice_image,
        po.subtotal,
        po.gst_amount,
        po.grand_total,
        po.notes,
        po.created_at,
        po.product_name,
        po.product_image,
        po.sizes,
        po.fabric_type,
        po.quantity,
        po.price_per_piece,
        po.total_amount,
        COALESCE(
          json_agg(
            json_build_object(
              'id', poi.id,
              'productName', poi.product_name,
              'category', poi.category,
              'sizes', poi.sizes,
              'fabricType', poi.fabric_type,
              'quantity', poi.quantity,
              'pricePerPiece', poi.price_per_piece,
              'totalAmount', poi.total_amount,
              'productImages', poi.product_images
            )
          ) FILTER (WHERE poi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM purchase_orders po
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      GROUP BY po.id, po.date, po.supplier_id, po.supplier_name, po.custom_po_number, 
        po.invoice_image, po.subtotal, po.gst_amount, po.grand_total, po.notes, po.created_at,
        po.product_name, po.product_image, po.sizes, po.fabric_type, po.quantity, po.price_per_piece, po.total_amount
      ORDER BY po.date DESC, po.created_at DESC
      LIMIT 5
    `)
    
    console.log(`\nFound ${result.rows.length} purchase orders:`)
    result.rows.forEach((row, idx) => {
      console.log(`\nOrder ${idx + 1}:`)
      console.log(`  ID: ${row.id}`)
      console.log(`  Supplier: ${row.supplier_name}`)
      console.log(`  Subtotal: ${row.subtotal}`)
      console.log(`  GST: ${row.gst_amount}`)
      console.log(`  Grand Total: ${row.grand_total}`)
      console.log(`  Items: ${JSON.stringify(row.items).substring(0, 100)}...`)
    })
    
  } catch (error) {
    console.error('Error:', error.message)
    console.error(error)
  } finally {
    client.release()
    await pool.end()
  }
}

test()

