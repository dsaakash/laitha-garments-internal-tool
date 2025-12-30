import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query('SELECT * FROM suppliers ORDER BY created_at DESC')
    
    const suppliers = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      phone: row.phone,
      email: row.email || '',
      address: row.address || '',
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }))
    
    return NextResponse.json({ success: true, data: suppliers })
  } catch (error) {
    console.error('Suppliers fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await query(
      `INSERT INTO suppliers (name, phone, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        body.name,
        body.phone,
        body.email || null,
        body.address || null,
      ]
    )
    
    const supplier = result.rows[0]
    const newSupplier = {
      id: supplier.id.toString(),
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      createdAt: supplier.created_at.toISOString(),
      updatedAt: supplier.updated_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: newSupplier })
  } catch (error) {
    console.error('Supplier add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add supplier' },
      { status: 500 }
    )
  }
}

