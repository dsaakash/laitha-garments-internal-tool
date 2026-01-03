require('dotenv').config()
const { Pool } = require('pg')
const readline = require('readline')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function createPOsFromInventory() {
  try {
    console.log('📦 Creating Purchase Orders from Inventory Items\n')
    
    // Get all inventory items
    const inventoryResult = await pool.query(`
      SELECT id, dress_name, dress_type, dress_code, sizes, 
             wholesale_price, selling_price, fabric_type, supplier_name,
             quantity_in, current_stock
      FROM inventory
      ORDER BY dress_name
    `)
    
    if (inventoryResult.rows.length === 0) {
      console.log('No inventory items found.')
      process.exit(0)
    }
    
    console.log(`Found ${inventoryResult.rows.length} inventory items\n`)
    
    // Get all suppliers
    const suppliersResult = await pool.query('SELECT id, name FROM suppliers ORDER BY name')
    
    if (suppliersResult.rows.length === 0) {
      console.log('❌ No suppliers found. Please create suppliers first.')
      process.exit(1)
    }
    
    console.log('Available Suppliers:')
    suppliersResult.rows.forEach((supplier, idx) => {
      console.log(`  ${idx + 1}. ${supplier.name} (ID: ${supplier.id})`)
    })
    
    const supplierChoice = await question('\nEnter supplier number to use (or supplier ID): ')
    let supplierId, supplierName
    
    if (isNaN(supplierChoice)) {
      supplierId = parseInt(supplierChoice)
    } else {
      const idx = parseInt(supplierChoice) - 1
      if (idx >= 0 && idx < suppliersResult.rows.length) {
        supplierId = suppliersResult.rows[idx].id
        supplierName = suppliersResult.rows[idx].name
      } else {
        console.log('Invalid supplier choice.')
        process.exit(1)
      }
    }
    
    if (!supplierName) {
      const supplier = suppliersResult.rows.find(s => s.id === supplierId)
      if (!supplier) {
        console.log('Supplier not found.')
        process.exit(1)
      }
      supplierName = supplier.name
    }
    
    const poDate = await question('\nEnter PO date (YYYY-MM-DD) or press Enter for today: ') || new Date().toISOString().split('T')[0]
    
    const createMode = await question('\nCreate mode:\n1. Create PO for items with 0 stock\n2. Create PO for all items\n3. Create PO for specific items\nEnter choice (1-3): ')
    
    let itemsToProcess = []
    
    if (createMode === '1') {
      itemsToProcess = inventoryResult.rows.filter(item => (item.current_stock || 0) === 0)
      console.log(`\nFound ${itemsToProcess.length} items with 0 stock`)
    } else if (createMode === '2') {
      itemsToProcess = inventoryResult.rows
      console.log(`\nProcessing all ${itemsToProcess.length} items`)
    } else if (createMode === '3') {
      console.log('\nAvailable items:')
      inventoryResult.rows.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.dress_name} (${item.dress_code}) - Stock: ${item.current_stock || 0}`)
      })
      
      const itemChoices = await question('\nEnter item numbers (comma-separated, e.g., 1,3,5): ')
      const indices = itemChoices.split(',').map(s => parseInt(s.trim()) - 1).filter(i => i >= 0 && i < inventoryResult.rows.length)
      itemsToProcess = indices.map(i => inventoryResult.rows[i])
      console.log(`\nProcessing ${itemsToProcess.length} selected items`)
    } else {
      console.log('Invalid choice.')
      process.exit(1)
    }
    
    if (itemsToProcess.length === 0) {
      console.log('No items to process.')
      process.exit(0)
    }
    
    const defaultQuantity = await question('\nEnter default quantity per item (or press Enter to skip items without quantity): ')
    const useDefaultQuantity = defaultQuantity && !isNaN(parseInt(defaultQuantity))
    const defaultQty = useDefaultQuantity ? parseInt(defaultQuantity) : 0
    
    console.log('\n🔄 Creating purchase orders...\n')
    
    let created = 0
    let skipped = 0
    
    for (const item of itemsToProcess) {
      let quantity = defaultQty
      
      if (!useDefaultQuantity) {
        const qtyInput = await question(`Enter quantity for "${item.dress_name}" (press Enter to skip): `)
        if (!qtyInput || isNaN(parseInt(qtyInput))) {
          console.log(`⏭️  Skipped ${item.dress_name}`)
          skipped++
          continue
        }
        quantity = parseInt(qtyInput)
      }
      
      if (quantity <= 0) {
        console.log(`⏭️  Skipped ${item.dress_name} (invalid quantity)`)
        skipped++
        continue
      }
      
      try {
        // Create purchase order
        const poResult = await pool.query(
          `INSERT INTO purchase_orders 
           (date, supplier_id, supplier_name, subtotal, gst_amount, grand_total, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            poDate,
            supplierId,
            supplierName,
            item.wholesale_price * quantity,
            0,
            item.wholesale_price * quantity,
            `Auto-created from inventory: ${item.dress_name}`
          ]
        )
        
        const poId = poResult.rows[0].id
        
        // Create purchase order item
        await pool.query(
          `INSERT INTO purchase_order_items 
           (purchase_order_id, product_name, category, sizes, fabric_type, 
            quantity, price_per_piece, total_amount, product_images)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            poId,
            item.dress_name,
            item.dress_type || 'Custom',
            item.sizes || [],
            item.fabric_type || null,
            quantity,
            item.wholesale_price,
            item.wholesale_price * quantity,
            []
          ]
        )
        
        // Update inventory stock
        const currentQuantityIn = parseInt(item.quantity_in) || 0
        const currentStock = parseInt(item.current_stock) || 0
        const newQuantityIn = currentQuantityIn + quantity
        const newCurrentStock = currentStock + quantity
        
        await pool.query(
          `UPDATE inventory 
           SET quantity_in = $1, 
               current_stock = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [newQuantityIn, newCurrentStock, item.id]
        )
        
        console.log(`✅ Created PO-${poId} for ${item.dress_name} (Qty: ${quantity}, Stock: ${newCurrentStock})`)
        created++
      } catch (error) {
        console.error(`❌ Error creating PO for ${item.dress_name}:`, error.message)
        skipped++
      }
    }
    
    console.log(`\n✅ Completed!`)
    console.log(`   Created: ${created} purchase orders`)
    console.log(`   Skipped: ${skipped} items`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    rl.close()
    await pool.end()
  }
}

createPOsFromInventory()

