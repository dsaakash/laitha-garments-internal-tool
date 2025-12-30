import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query('SELECT * FROM customers ORDER BY created_at DESC')
    
    const customers = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      phone: row.phone,
      email: row.email || '',
      address: row.address || '',
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }))
    
    return NextResponse.json({ success: true, data: customers })
  } catch (error) {
    console.error('Customers fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await query(
      `INSERT INTO customers (name, phone, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        body.name,
        body.phone,
        body.email || null,
        body.address || null,
      ]
    )
    
    const customer = result.rows[0]
    const newCustomer = {
      id: customer.id.toString(),
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      createdAt: customer.created_at.toISOString(),
      updatedAt: customer.updated_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: newCustomer })
  } catch (error) {
    console.error('Customer add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add customer' },
      { status: 500 }
    )
  }
}

