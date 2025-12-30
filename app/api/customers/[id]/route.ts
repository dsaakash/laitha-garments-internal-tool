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
        { success: false, message: 'Invalid customer ID' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `UPDATE customers 
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
        { success: false, message: 'Customer not found' },
        { status: 404 }
      )
    }
    
    const customer = result.rows[0]
    const updatedCustomer = {
      id: customer.id.toString(),
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      createdAt: customer.created_at.toISOString(),
      updatedAt: customer.updated_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: updatedCustomer })
  } catch (error) {
    console.error('Customer update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update customer' },
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
        { success: false, message: 'Invalid customer ID' },
        { status: 400 }
      )
    }
    
    const result = await query('DELETE FROM customers WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Customer delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}

