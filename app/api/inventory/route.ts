import { NextRequest, NextResponse } from 'next/server'
import { storage, InventoryItem } from '@/lib/storage'

export async function GET() {
  try {
    const items = storage.getInventory()
    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const item = storage.addInventory(body)
    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to add inventory item' },
      { status: 500 }
    )
  }
}

