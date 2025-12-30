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
        { success: false, message: 'Invalid inventory ID' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `UPDATE inventory 
       SET dress_name = $1, dress_type = $2, dress_code = $3, sizes = $4,
           wholesale_price = $5, selling_price = $6, image_url = $7,
           fabric_type = $8, supplier_name = $9, supplier_address = $10,
           supplier_phone = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        body.dressName,
        body.dressType,
        body.dressCode,
        body.sizes || [],
        body.wholesalePrice,
        body.sellingPrice,
        body.imageUrl || null,
        body.fabricType || null,
        body.supplierName || null,
        body.supplierAddress || null,
        body.supplierPhone || null,
        id,
      ]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      )
    }
    
    const item = result.rows[0]
    const updatedItem = {
      id: item.id.toString(),
      dressName: item.dress_name,
      dressType: item.dress_type,
      dressCode: item.dress_code,
      sizes: item.sizes || [],
      wholesalePrice: parseFloat(item.wholesale_price),
      sellingPrice: parseFloat(item.selling_price),
      imageUrl: item.image_url || '',
      fabricType: item.fabric_type || '',
      supplierName: item.supplier_name || '',
      supplierAddress: item.supplier_address || '',
      supplierPhone: item.supplier_phone || '',
      createdAt: item.created_at.toISOString(),
      updatedAt: item.updated_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: updatedItem })
  } catch (error) {
    console.error('Inventory update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update inventory item' },
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
        { success: false, message: 'Invalid inventory ID' },
        { status: 400 }
      )
    }
    
    const result = await query('DELETE FROM inventory WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Inventory delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}
