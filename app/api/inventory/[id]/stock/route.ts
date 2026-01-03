import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory ID' },
        { status: 400 }
      )
    }

    const quantity = parseInt(body.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid quantity' },
        { status: 400 }
      )
    }

    // Get current stock values
    const currentResult = await query(
      'SELECT quantity_in, quantity_out, current_stock FROM inventory WHERE id = $1',
      [id]
    )

    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Inventory item not found' },
        { status: 404 }
      )
    }

    const current = currentResult.rows[0]
    let newQuantityIn = parseInt(current.quantity_in) || 0
    let newQuantityOut = parseInt(current.quantity_out) || 0
    let newCurrentStock = parseInt(current.current_stock) || 0

    if (body.type === 'in') {
      newQuantityIn += quantity
      newCurrentStock += quantity
    } else if (body.type === 'out') {
      newQuantityOut += quantity
      newCurrentStock -= quantity
      if (newCurrentStock < 0) {
        return NextResponse.json(
          { success: false, message: 'Insufficient stock. Cannot remove more than available.' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid stock type. Must be "in" or "out"' },
        { status: 400 }
      )
    }

    // Update inventory
    const result = await query(
      `UPDATE inventory 
       SET quantity_in = $1, quantity_out = $2, current_stock = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [newQuantityIn, newQuantityOut, newCurrentStock, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to update stock' },
        { status: 500 }
      )
    }

    const updatedItem = result.rows[0]
    
    // Optionally create a stock transaction log (you can create a stock_transactions table later)
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedItem.id.toString(),
        quantityIn: parseInt(updatedItem.quantity_in),
        quantityOut: parseInt(updatedItem.quantity_out),
        currentStock: parseInt(updatedItem.current_stock),
      }
    })
  } catch (error: any) {
    console.error('Stock update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update stock',
        error: error?.message || String(error)
      },
      { status: 500 }
    )
  }
}

