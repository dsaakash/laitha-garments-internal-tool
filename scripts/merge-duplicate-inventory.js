const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

function normalizeProductName(name) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

async function mergeDuplicates() {
  console.log('🔧 Merging duplicate inventory items...\n')
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // Get all inventory items
    const inventoryResult = await client.query(`
      SELECT id, dress_name, dress_code, fabric_type, quantity_in, quantity_out, current_stock
      FROM inventory
      ORDER BY dress_name
    `)
    
    // Group by normalized name and fabric type
    const groups = new Map()
    for (const item of inventoryResult.rows) {
      const normalizedName = normalizeProductName(item.dress_name)
      const fabricType = (item.fabric_type || 'standard').trim().toLowerCase()
      const key = `${normalizedName}_${fabricType}`
      
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push(item)
    }
    
    let merged = 0
    
    for (const [key, items] of groups.entries()) {
      if (items.length > 1) {
        // Found duplicates - merge them
        console.log(`\n⚠️  Found ${items.length} duplicate items for: ${items[0].dress_name}`)
        
        // Sort by ID to keep the oldest one
        items.sort((a, b) => a.id - b.id)
        const keepItem = items[0]
        const mergeItems = items.slice(1)
        
        // Calculate totals
        let totalQuantityIn = parseInt(keepItem.quantity_in) || 0
        let totalQuantityOut = parseInt(keepItem.quantity_out) || 0
        
        for (const item of mergeItems) {
          totalQuantityIn += parseInt(item.quantity_in) || 0
          totalQuantityOut += parseInt(item.quantity_out) || 0
          console.log(`   Merging ID ${item.id}: quantity_in=${item.quantity_in}, quantity_out=${item.quantity_out}`)
        }
        
        const totalCurrentStock = totalQuantityIn - totalQuantityOut
        
        // Update the kept item
        const normalizedName = keepItem.dress_name.trim().replace(/\s+/g, ' ')
        const dressCode = `${normalizedName}_${keepItem.fabric_type || 'standard'}`.replace(/\s+/g, '_').toUpperCase()
        
        await client.query(
          `UPDATE inventory
           SET dress_name = $1,
               dress_code = $2,
               quantity_in = $3,
               quantity_out = $4,
               current_stock = $5,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $6`,
          [normalizedName, dressCode, totalQuantityIn, totalQuantityOut, totalCurrentStock, keepItem.id]
        )
        
        // Delete merged items
        for (const item of mergeItems) {
          await client.query('DELETE FROM inventory WHERE id = $1', [item.id])
        }
        
        console.log(`   ✅ Merged into ID ${keepItem.id}: quantity_in=${totalQuantityIn}, quantity_out=${totalQuantityOut}, current_stock=${totalCurrentStock}`)
        merged += mergeItems.length
      }
    }
    
    await client.query('COMMIT')
    
    console.log(`\n📊 Summary:`)
    console.log(`   Total inventory items checked: ${inventoryResult.rows.length}`)
    console.log(`   Duplicate groups found: ${Array.from(groups.values()).filter(g => g.length > 1).length}`)
    console.log(`   Items merged: ${merged}`)
    
    if (merged > 0) {
      console.log(`\n✅ Merged ${merged} duplicate inventory item(s)!`)
    } else {
      console.log(`\n✅ No duplicate inventory items found!`)
    }
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error merging duplicates:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

mergeDuplicates()
