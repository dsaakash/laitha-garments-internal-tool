import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    
    let sales = storage.getSales()
    
    if (year) {
      sales = sales.filter(sale => {
        const saleYear = new Date(sale.date).getFullYear().toString()
        return saleYear === year
      })
    }
    
    if (month) {
      sales = sales.filter(sale => {
        const saleMonth = (new Date(sale.date).getMonth() + 1).toString().padStart(2, '0')
        return saleMonth === month
      })
    }
    
    sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return NextResponse.json({ success: true, data: sales })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sale = storage.addSale(body)
    return NextResponse.json({ success: true, data: sale })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to add sale' },
      { status: 500 }
    )
  }
}

