import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const item = storage.updateInventory(params.id, body)
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: item })
  } catch (error) {
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
    const deleted = storage.deleteInventory(params.id)
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}

