import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query('SELECT * FROM catalogues ORDER BY created_at DESC')
    
    const catalogues = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      description: row.description || '',
      items: (row.items || []).map((id: number) => id.toString()),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }))
    
    return NextResponse.json({ success: true, data: catalogues })
  } catch (error) {
    console.error('Catalogues fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch catalogues' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const itemIds = (body.items || []).map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id))
    
    const result = await query(
      `INSERT INTO catalogues (name, description, items)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        body.name,
        body.description || null,
        itemIds,
      ]
    )
    
    const catalogue = result.rows[0]
    const newCatalogue = {
      id: catalogue.id.toString(),
      name: catalogue.name,
      description: catalogue.description || '',
      items: (catalogue.items || []).map((id: number) => id.toString()),
      createdAt: catalogue.created_at.toISOString(),
      updatedAt: catalogue.updated_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: newCatalogue })
  } catch (error) {
    console.error('Catalogue add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add catalogue' },
      { status: 500 }
    )
  }
}

