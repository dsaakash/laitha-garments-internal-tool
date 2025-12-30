import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    
    let queryText = `
      SELECT s.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'inventoryId', si.inventory_id::text,
                   'dressName', si.dress_name,
                   'dressType', si.dress_type,
                   'dressCode', si.dress_code,
                   'size', si.size,
                   'quantity', si.quantity,
                   'purchasePrice', si.purchase_price,
                   'sellingPrice', si.selling_price,
                   'profit', si.profit
                 )
               ) FILTER (WHERE si.id IS NOT NULL),
               '[]'::json
             ) as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
    `
    
    const conditions: string[] = []
    const params: any[] = []
    let paramCount = 1
    
    if (year) {
      conditions.push(`EXTRACT(YEAR FROM s.date) = $${paramCount}`)
      params.push(year)
      paramCount++
    }
    
    if (month) {
      conditions.push(`EXTRACT(MONTH FROM s.date) = $${paramCount}`)
      params.push(month)
      paramCount++
    }
    
    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ')
    }
    
    queryText += ' GROUP BY s.id ORDER BY s.date DESC'
    
    const result = await query(queryText, params)
    
    const sales = result.rows.map(row => ({
      id: row.id.toString(),
      date: row.date.toISOString().split('T')[0],
      partyName: row.party_name,
      customerId: row.customer_id ? row.customer_id.toString() : undefined,
      billNumber: row.bill_number,
      items: row.items || [],
      totalAmount: parseFloat(row.total_amount),
      paymentMode: row.payment_mode,
      upiTransactionId: row.upi_transaction_id || undefined,
      createdAt: row.created_at.toISOString(),
    }))
    
    return NextResponse.json({ success: true, data: sales })
  } catch (error) {
    console.error('Sales fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Start transaction - insert sale first
    const saleResult = await query(
      `INSERT INTO sales 
       (date, party_name, customer_id, bill_number, total_amount, payment_mode, upi_transaction_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        body.date,
        body.partyName,
        body.customerId ? parseInt(body.customerId) : null,
        body.billNumber,
        body.totalAmount,
        body.paymentMode,
        body.upiTransactionId || null,
      ]
    )
    
    const sale = saleResult.rows[0]
    const saleId = sale.id
    
    // Insert sale items
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        await query(
          `INSERT INTO sale_items 
           (sale_id, inventory_id, dress_name, dress_type, dress_code, size, 
            quantity, purchase_price, selling_price, profit)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            saleId,
            item.inventoryId ? parseInt(item.inventoryId) : null,
            item.dressName,
            item.dressType,
            item.dressCode,
            item.size,
            item.quantity,
            item.purchasePrice,
            item.sellingPrice,
            item.profit,
          ]
        )
      }
    }
    
    // Fetch complete sale with items
    const completeSaleResult = await query(
      `SELECT s.*, 
              COALESCE(
                json_agg(
                  json_build_object(
                    'inventoryId', si.inventory_id::text,
                    'dressName', si.dress_name,
                    'dressType', si.dress_type,
                    'dressCode', si.dress_code,
                    'size', si.size,
                    'quantity', si.quantity,
                    'purchasePrice', si.purchase_price,
                    'sellingPrice', si.selling_price,
                    'profit', si.profit
                  )
                ) FILTER (WHERE si.id IS NOT NULL),
                '[]'::json
              ) as items
       FROM sales s
       LEFT JOIN sale_items si ON s.id = si.sale_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [saleId]
    )
    
    const completeSale = completeSaleResult.rows[0]
    const newSale = {
      id: completeSale.id.toString(),
      date: completeSale.date.toISOString().split('T')[0],
      partyName: completeSale.party_name,
      customerId: completeSale.customer_id ? completeSale.customer_id.toString() : undefined,
      billNumber: completeSale.bill_number,
      items: completeSale.items || [],
      totalAmount: parseFloat(completeSale.total_amount),
      paymentMode: completeSale.payment_mode,
      upiTransactionId: completeSale.upi_transaction_id || undefined,
      createdAt: completeSale.created_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: newSale })
  } catch (error) {
    console.error('Sales add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add sale' },
      { status: 500 }
    )
  }
}
