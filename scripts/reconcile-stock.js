require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function reconcileStock() {
  try {
    console.log('🔍 Starting Stock Reconciliation...\n')
    
    // Step 1: Find all inventory items with issues
    const allInventory = await pool.query(`
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
    
    console.log(`Found ${allInventory.rows.length} inventory items\n`)
    
    let issuesFound = 0
    let fixed = 0
    let needsManualReview = 0
    
    // Step 2: Calculate expected stock from purchase orders and sales
    for (const item of allInventory.rows) {
      const quantityIn = parseInt(item.quantity_in) || 0
      const quantityOut = parseInt(item.quantity_out) || 0
      const currentStock = parseInt(item.current_stock) || 0
      const calculatedStock = quantityIn - quantityOut
      
      const issues = []
      
      // Check for negative quantity_in
      if (quantityIn < 0) {
        issues.push(`Negative quantity_in: ${quantityIn}`)
      }
      
      // Check for negative quantity_out
      if (quantityOut < 0) {
        issues.push(`Negative quantity_out: ${quantityOut}`)
      }
      
      // Check stock relationship
      if (currentStock !== calculatedStock) {
        issues.push(`Stock mismatch: current_stock (${currentStock}) ≠ quantity_in (${quantityIn}) - quantity_out (${quantityOut}) = ${calculatedStock}`)
      }
      
      // Check for negative current stock (might be valid if quantity_out > quantity_in)
      if (currentStock < 0 && calculatedStock < 0) {
        issues.push(`Negative stock: ${currentStock}`)
      }
      
      if (issues.length > 0) {
        issuesFound++
        console.log(`\n⚠️  Item #${item.id}: ${item.dress_name} (${item.dress_code})`)
        issues.forEach(issue => console.log(`   - ${issue}`))
        
        // Calculate expected values from purchase orders
        const poItems = await pool.query(`
          SELECT SUM(quantity) as total_quantity
          FROM purchase_order_items poi
          JOIN purchase_orders po ON poi.purchase_order_id = po.id
          WHERE poi.product_name = $1 
            OR poi.fabric_type = $2
            OR LOWER(TRIM(poi.product_name)) = LOWER(TRIM($3))
        `, [item.dress_name, item.dress_code, item.dress_name])
        
        const expectedQuantityIn = parseInt(poItems.rows[0]?.total_quantity) || 0
        
        // Calculate expected quantity_out from sales
        const saleItems = await pool.query(`
          SELECT SUM(quantity) as total_quantity
          FROM sale_items
          WHERE inventory_id = $1 
            OR dress_code = $2
            OR LOWER(TRIM(dress_name)) = LOWER(TRIM($3))
        `, [item.id, item.dress_code, item.dress_name])
        
        const expectedQuantityOut = parseInt(saleItems.rows[0]?.total_quantity) || 0
        const expectedStock = expectedQuantityIn - expectedQuantityOut
        
        console.log(`   📊 Expected from POs: quantity_in = ${expectedQuantityIn}`)
        console.log(`   📊 Expected from Sales: quantity_out = ${expectedQuantityOut}`)
        console.log(`   📊 Expected stock: ${expectedStock}`)
        console.log(`   📊 Current: quantity_in = ${quantityIn}, quantity_out = ${quantityOut}, current_stock = ${currentStock}`)
        
        // Auto-fix if we can
        let shouldFix = false
        let newQuantityIn = quantityIn
        let newQuantityOut = quantityOut
        let newCurrentStock = currentStock
        
        // Fix negative quantity_in
        if (quantityIn < 0) {
          if (expectedQuantityIn > 0) {
            newQuantityIn = expectedQuantityIn
            shouldFix = true
            console.log(`   ✅ Will fix: quantity_in ${quantityIn} → ${newQuantityIn}`)
          } else {
            newQuantityIn = 0
            shouldFix = true
            console.log(`   ✅ Will fix: quantity_in ${quantityIn} → 0 (no purchase orders found)`)
          }
        }
        
        // Fix negative quantity_out
        if (quantityOut < 0) {
          if (expectedQuantityOut > 0) {
            newQuantityOut = expectedQuantityOut
            shouldFix = true
            console.log(`   ✅ Will fix: quantity_out ${quantityOut} → ${newQuantityOut}`)
          } else {
            newQuantityOut = 0
            shouldFix = true
            console.log(`   ✅ Will fix: quantity_out ${quantityOut} → 0 (no sales found)`)
          }
        }
        
        // Fix stock relationship mismatch
        if (currentStock !== calculatedStock) {
          newCurrentStock = newQuantityIn - newQuantityOut
          shouldFix = true
          console.log(`   ✅ Will fix: current_stock ${currentStock} → ${newCurrentStock}`)
        }
        
        // If we have expected values and they're different, use them
        if (expectedQuantityIn > 0 && Math.abs(expectedQuantityIn - newQuantityIn) > 0) {
          console.log(`   💡 Suggestion: Use expected quantity_in = ${expectedQuantityIn} (from purchase orders)`)
        }
        
        if (expectedQuantityOut > 0 && Math.abs(expectedQuantityOut - newQuantityOut) > 0) {
          console.log(`   💡 Suggestion: Use expected quantity_out = ${expectedQuantityOut} (from sales)`)
        }
        
        if (shouldFix) {
          // Update the inventory item
          await pool.query(`
            UPDATE inventory
            SET quantity_in = $1,
                quantity_out = $2,
                current_stock = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
          `, [newQuantityIn, newQuantityOut, newCurrentStock, item.id])
          
          fixed++
          console.log(`   ✅ Fixed!`)
        } else {
          needsManualReview++
          console.log(`   ⚠️  Needs manual review`)
        }
      }
    }
    
    // Step 3: Summary
    console.log(`\n\n📊 Reconciliation Summary:`)
    console.log(`   Total items checked: ${allInventory.rows.length}`)
    console.log(`   Issues found: ${issuesFound}`)
    console.log(`   Auto-fixed: ${fixed}`)
    console.log(`   Needs manual review: ${needsManualReview}`)
    
    // Step 4: Show remaining issues
    if (needsManualReview > 0) {
      console.log(`\n⚠️  Items that need manual review:`)
      const remainingIssues = await pool.query(`
        SELECT 
          id, 
          dress_name, 
          dress_code,
          quantity_in,
          quantity_out,
          current_stock
        FROM inventory
        WHERE quantity_in < 0 
           OR quantity_out < 0
           OR current_stock != (quantity_in - quantity_out)
        ORDER BY id
      `)
      
      remainingIssues.rows.forEach(item => {
        const calculated = (parseInt(item.quantity_in) || 0) - (parseInt(item.quantity_out) || 0)
        console.log(`   - #${item.id}: ${item.dress_name} (In: ${item.quantity_in}, Out: ${item.quantity_out}, Stock: ${item.current_stock}, Expected: ${calculated})`)
      })
    }
    
    console.log(`\n✅ Reconciliation completed!`)
    
    await pool.end()
  } catch (error) {
    console.error('❌ Error:', error)
    await pool.end()
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  reconcileStock()
}

module.exports = { reconcileStock }
