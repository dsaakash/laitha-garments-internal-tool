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
        { success: false, message: 'Invalid catalogue ID' },
        { status: 400 }
      )
    }
    
    const itemIds = (body.items || []).map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id))
    
    const result = await query(
      `UPDATE catalogues 
       SET name = $1, description = $2, items = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [
        body.name,
        body.description || null,
        itemIds,
        id,
      ]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Catalogue not found' },
        { status: 404 }
      )
    }
    
    const catalogue = result.rows[0]
    const updatedCatalogue = {
      id: catalogue.id.toString(),
      name: catalogue.name,
      description: catalogue.description || '',
      items: (catalogue.items || []).map((id: number) => id.toString()),
      createdAt: catalogue.created_at.toISOString(),
      updatedAt: catalogue.updated_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: updatedCatalogue })
  } catch (error) {
    console.error('Catalogue update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update catalogue' },
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
        { success: false, message: 'Invalid catalogue ID' },
        { status: 400 }
      )
    }
    
    const result = await query('DELETE FROM catalogues WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Catalogue not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Catalogue delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete catalogue' },
      { status: 500 }
    )
  }
}

