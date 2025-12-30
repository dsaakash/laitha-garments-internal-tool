import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query('SELECT * FROM purchase_orders ORDER BY date DESC, created_at DESC')
    
    const orders = result.rows.map(row => ({
      id: row.id.toString(),
      date: row.date.toISOString().split('T')[0],
      supplierId: row.supplier_id ? row.supplier_id.toString() : '',
      supplierName: row.supplier_name,
      productName: row.product_name,
      productImage: row.product_image || '',
      sizes: row.sizes || [],
      fabricType: row.fabric_type || '',
      quantity: row.quantity,
      pricePerPiece: parseFloat(row.price_per_piece),
      totalAmount: parseFloat(row.total_amount),
      notes: row.notes || '',
      createdAt: row.created_at.toISOString(),
    }))
    
    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('Purchase orders fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await query(
      `INSERT INTO purchase_orders 
       (date, supplier_id, supplier_name, product_name, product_image, sizes, 
        fabric_type, quantity, price_per_piece, total_amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        body.date,
        body.supplierId ? parseInt(body.supplierId) : null,
        body.supplierName,
        body.productName,
        body.productImage || null,
        body.sizes || [],
        body.fabricType || null,
        body.quantity,
        body.pricePerPiece,
        body.totalAmount,
        body.notes || null,
      ]
    )
    
    const order = result.rows[0]
    const newOrder = {
      id: order.id.toString(),
      date: order.date.toISOString().split('T')[0],
      supplierId: order.supplier_id ? order.supplier_id.toString() : '',
      supplierName: order.supplier_name,
      productName: order.product_name,
      productImage: order.product_image || '',
      sizes: order.sizes || [],
      fabricType: order.fabric_type || '',
      quantity: order.quantity,
      pricePerPiece: parseFloat(order.price_per_piece),
      totalAmount: parseFloat(order.total_amount),
      notes: order.notes || '',
      createdAt: order.created_at.toISOString(),
    }
    
    // Auto-add to inventory
    // Check if inventory item exists with same dress code
    const dressCode = `${order.product_name}_${order.fabric_type || 'standard'}`.replace(/\s+/g, '_').toUpperCase()
    
    const existingInventory = await query(
      'SELECT * FROM inventory WHERE dress_code = $1',
      [dressCode]
    )
    
    if (existingInventory.rows.length > 0) {
      // Update existing inventory
      const existing = existingInventory.rows[0]
      const existingSizes = existing.sizes || []
      const newSizes = order.sizes || []
      const mergedSizes = Array.from(new Set([...existingSizes, ...newSizes]))
      
      await query(
        `UPDATE inventory 
         SET sizes = $1, 
             wholesale_price = $2, selling_price = $3,
             fabric_type = COALESCE($4, fabric_type),
             supplier_name = COALESCE($5, supplier_name),
             supplier_phone = COALESCE($6, supplier_phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [
          mergedSizes,
          order.price_per_piece,
          (parseFloat(order.price_per_piece) * 2).toFixed(2),
          order.fabric_type,
          order.supplier_name,
          null, // supplier_phone not in purchase_orders
          existing.id,
        ]
      )
    } else {
      // Create new inventory item
      await query(
        `INSERT INTO inventory 
         (dress_name, dress_type, dress_code, sizes, wholesale_price, selling_price,
          image_url, fabric_type, supplier_name, supplier_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          order.product_name,
          'Custom', // Default type
          dressCode,
          order.sizes || [],
          order.price_per_piece,
          (parseFloat(order.price_per_piece) * 2).toFixed(2),
          order.product_image,
          order.fabric_type,
          order.supplier_name,
          null,
        ]
      )
    }
    
    return NextResponse.json({ success: true, data: newOrder })
  } catch (error) {
    console.error('Purchase order add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add purchase order' },
      { status: 500 }
    )
  }
}

