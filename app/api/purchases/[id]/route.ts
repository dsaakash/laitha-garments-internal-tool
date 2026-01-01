import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

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

