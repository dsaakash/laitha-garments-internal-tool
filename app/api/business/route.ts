import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export async function GET() {
  try {
    const profile = storage.getBusinessProfile()
    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch business profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const profile = storage.updateBusinessProfile(body)
    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update business profile' },
      { status: 500 }
    )
  }
}

