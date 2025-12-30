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
        { success: false, message: 'Invalid supplier ID' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `UPDATE suppliers 
       SET name = $1, phone = $2, email = $3, address = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        body.name,
        body.phone,
        body.email || null,
        body.address || null,
        id,
      ]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Supplier not found' },
        { status: 404 }
      )
    }
    
    const supplier = result.rows[0]
    const updatedSupplier = {
      id: supplier.id.toString(),
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      createdAt: supplier.created_at.toISOString(),
      updatedAt: supplier.updated_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: updatedSupplier })
  } catch (error) {
    console.error('Supplier update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update supplier' },
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
        { success: false, message: 'Invalid supplier ID' },
        { status: 400 }
      )
    }
    
    const result = await query('DELETE FROM suppliers WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Supplier not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Supplier delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}

