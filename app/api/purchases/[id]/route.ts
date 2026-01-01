import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid purchase order ID' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `UPDATE purchase_orders 
       SET date = $1, supplier_id = $2, supplier_name = $3, product_name = $4, 
           product_image = $5, sizes = $6, fabric_type = $7, quantity = $8,
           price_per_piece = $9, total_amount = $10, notes = $11
       WHERE id = $12
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
        id,
      ]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Purchase order not found' },
        { status: 404 }
      )
    }
    
    const order = result.rows[0]
    const updatedOrder = {
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
    
    // Update related inventory item if it exists
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
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [
          mergedSizes,
          order.price_per_piece,
          (parseFloat(order.price_per_piece) * 2).toFixed(2),
          order.fabric_type,
          order.supplier_name,
          existing.id,
        ]
      )
    }
    
    return NextResponse.json({ success: true, data: updatedOrder })
  } catch (error: any) {
    console.error('Purchase order update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update purchase order',
        error: error?.message || String(error)
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid purchase order ID' },
        { status: 400 }
      )
    }
    
    const result = await query('DELETE FROM purchase_orders WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Purchase order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Purchase order delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete purchase order' },
      { status: 500 }
    )
  }
}

