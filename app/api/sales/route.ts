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
                   'usePerMeter', si.use_per_meter,
                   'meters', si.meters,
                   'pricePerMeter', si.price_per_meter,
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
      subtotal: row.subtotal ? parseFloat(row.subtotal) : parseFloat(row.total_amount),
      discountType: row.discount_type || undefined,
      discountPercentage: row.discount_percentage ? parseFloat(row.discount_percentage) : undefined,
      discountAmount: row.discount_amount ? parseFloat(row.discount_amount) : undefined,
      gstType: row.gst_type || undefined,
      gstPercentage: row.gst_percentage ? parseFloat(row.gst_percentage) : undefined,
      gstAmount: row.gst_amount ? parseFloat(row.gst_amount) : undefined,
      totalAmount: parseFloat(row.total_amount),
      finalTotal: row.final_total ? parseFloat(row.final_total) : parseFloat(row.total_amount),
      paymentMode: row.payment_mode,
      upiTransactionId: row.upi_transaction_id || undefined,
      saleImage: row.sale_image || undefined,
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
       (date, party_name, customer_id, bill_number, subtotal, discount_type, discount_percentage, discount_amount,
        gst_type, gst_percentage, gst_amount, total_amount, final_total, payment_mode, upi_transaction_id, sale_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        body.date,
        body.partyName,
        body.customerId ? parseInt(body.customerId) : null,
        body.billNumber,
        body.subtotal || body.totalAmount,
        body.discountType || null,
        body.discountPercentage || null,
        body.discountAmount || null,
        body.gstType || null,
        body.gstPercentage || null,
        body.gstAmount || null,
        body.totalAmount,
        body.finalTotal || body.totalAmount,
        body.paymentMode,
        body.upiTransactionId || null,
        body.saleImage || null,
      ]
    )
    
    const sale = saleResult.rows[0]
    const saleId = sale.id
    
    // Insert sale items and update inventory stock
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        await query(
          `INSERT INTO sale_items 
           (sale_id, inventory_id, dress_name, dress_type, dress_code, size, 
            quantity, use_per_meter, meters, price_per_meter, purchase_price, selling_price, profit)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            saleId,
            item.inventoryId ? parseInt(item.inventoryId) : null,
            item.dressName,
            item.dressType,
            item.dressCode,
            item.size,
            item.quantity,
            item.usePerMeter || false,
            item.meters || null,
            item.pricePerMeter || null,
            item.purchasePrice,
            item.sellingPrice,
            item.profit,
          ]
        )
        
        // Update inventory stock: decrease quantity_out and current_stock
        if (item.inventoryId) {
          const inventoryResult = await query(
            'SELECT quantity_out, current_stock FROM inventory WHERE id = $1',
            [parseInt(item.inventoryId)]
          )
          
          if (inventoryResult.rows.length > 0) {
            const inventory = inventoryResult.rows[0]
            const currentQuantityOut = parseInt(inventory.quantity_out) || 0
            const currentStock = parseInt(inventory.current_stock) || 0
            // Use meters if per meter pricing, otherwise use quantity
            const quantityToDeduct = item.usePerMeter && item.meters ? item.meters : item.quantity
            const newQuantityOut = currentQuantityOut + quantityToDeduct
            const newCurrentStock = Math.max(0, currentStock - quantityToDeduct) // Prevent negative stock
            
            await query(
              `UPDATE inventory 
               SET quantity_out = $1, 
                   current_stock = $2,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $3`,
              [newQuantityOut, newCurrentStock, parseInt(item.inventoryId)]
            )
          }
        } else if (item.dressCode) {
          // Try to find inventory by dress_code if inventory_id is not provided
          const inventoryResult = await query(
            'SELECT id, quantity_out, current_stock FROM inventory WHERE dress_code = $1',
            [item.dressCode]
          )
          
          if (inventoryResult.rows.length > 0) {
            const inventory = inventoryResult.rows[0]
            const currentQuantityOut = parseInt(inventory.quantity_out) || 0
            const currentStock = parseInt(inventory.current_stock) || 0
            const newQuantityOut = currentQuantityOut + item.quantity
            const newCurrentStock = Math.max(0, currentStock - item.quantity) // Prevent negative stock
            
            await query(
              `UPDATE inventory 
               SET quantity_out = $1, 
                   current_stock = $2,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $3`,
              [newQuantityOut, newCurrentStock, inventory.id]
            )
          }
        }
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
      saleImage: completeSale.sale_image || undefined,
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
