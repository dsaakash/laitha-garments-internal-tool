const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function fixNegativeStock() {
  console.log('🔍 Checking inventory for negative stock values...\n')
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // Get all inventory items
    const result = await client.query(`
      SELECT 
        id,
        dress_name,
        dress_code,
        quantity_in,
        quantity_out,
        current_stock
      FROM inventory
      ORDER BY id
    `)
    
    console.log(`Found ${result.rows.length} inventory items\n`)
    
    let fixedCount = 0
    let issuesFound = 0
    
    for (const item of result.rows) {
      let quantityIn = parseInt(item.quantity_in) || 0
      let quantityOut = parseInt(item.quantity_out) || 0
      let currentStock = parseInt(item.current_stock) || 0
      
      const originalValues = {
        quantityIn,
        quantityOut,
        currentStock
      }
      
      let needsFix = false
      const issues = []
      
      // Check for negative quantity_in
      if (quantityIn < 0) {
        issues.push(`quantity_in is negative: ${quantityIn}`)
        quantityIn = 0
        needsFix = true
      }
      
      // Check for negative quantity_out
      if (quantityOut < 0) {
        issues.push(`quantity_out is negative: ${quantityOut}`)
        quantityOut = 0
        needsFix = true
      }
      
      // Recalculate current_stock based on relationship: current_stock = quantity_in - quantity_out
      const calculatedStock = quantityIn - quantityOut
      
      // Check if current_stock is negative or doesn't match the relationship
      if (currentStock < 0 || currentStock !== calculatedStock) {
        issues.push(`current_stock mismatch: ${currentStock} (should be ${calculatedStock})`)
        currentStock = Math.max(0, calculatedStock) // Ensure it's not negative
        needsFix = true
      }
      
      if (needsFix) {
        issuesFound++
        console.log(`\n⚠️  Item #${item.id}: ${item.dress_name} (${item.dress_code})`)
        console.log(`   Before: quantity_in=${originalValues.quantityIn}, quantity_out=${originalValues.quantityOut}, current_stock=${originalValues.currentStock}`)
        issues.forEach(issue => console.log(`   - ${issue}`))
        
        // Update the inventory item
        await client.query(`
          UPDATE inventory
          SET quantity_in = $1,
              quantity_out = $2,
              current_stock = $3,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [quantityIn, quantityOut, currentStock, item.id])
        
        console.log(`   ✅ Fixed: quantity_in=${quantityIn}, quantity_out=${quantityOut}, current_stock=${currentStock}`)
        fixedCount++
      }
    }
    
    await client.query('COMMIT')
    
    console.log(`\n📊 Summary:`)
    console.log(`   Total items checked: ${result.rows.length}`)
    console.log(`   Items with issues: ${issuesFound}`)
    console.log(`   Items fixed: ${fixedCount}`)
    
    if (issuesFound === 0) {
      console.log(`\n✅ No negative stock values found! All inventory items are correct.`)
    } else {
      console.log(`\n✅ Fixed ${fixedCount} inventory item(s) with negative or incorrect stock values.`)
    }
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error fixing negative stock:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

fixNegativeStock()
