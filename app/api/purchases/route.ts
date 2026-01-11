import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    let ordersQuery = `
      SELECT 
        po.id,
        po.date,
        po.supplier_id,
        po.supplier_name,
        po.custom_po_number,
        po.invoice_image,
        po.subtotal,
        po.gst_amount,
        po.grand_total,
        po.gst_type,
        po.gst_percentage,
        po.gst_amount_rupees,
        po.notes,
        po.created_at,
        po.product_name,
        po.product_image,
        po.sizes,
        po.fabric_type,
        po.quantity,
        po.price_per_piece,
        po.total_amount,
        COALESCE(
          json_agg(
            json_build_object(
              'id', poi.id,
              'productName', poi.product_name,
              'category', poi.category,
              'sizes', poi.sizes,
              'fabricType', poi.fabric_type,
              'quantity', poi.quantity,
              'pricePerPiece', poi.price_per_piece,
              'totalAmount', poi.total_amount,
              'productImages', poi.product_images
            )
          ) FILTER (WHERE poi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM purchase_orders po
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
    `
    
    const conditions: string[] = []
    const params: any[] = []
    let paramCount = 1
    
    if (category && category !== 'All') {
      conditions.push(`EXISTS (
        SELECT 1 FROM purchase_order_items poi2 
        WHERE poi2.purchase_order_id = po.id 
        AND poi2.category = $${paramCount}
      )`)
      params.push(category)
      paramCount++
    }
    
    if (conditions.length > 0) {
      ordersQuery += ` WHERE ${conditions.join(' AND ')}`
    }
    
    ordersQuery += ` GROUP BY po.id, po.date, po.supplier_id, po.supplier_name, po.custom_po_number, 
      po.invoice_image, po.subtotal, po.gst_amount, po.grand_total, po.gst_type, po.gst_percentage, po.gst_amount_rupees,
      po.notes, po.created_at, po.product_name, po.product_image, po.sizes, po.fabric_type, po.quantity, po.price_per_piece, po.total_amount
      ORDER BY po.date DESC, po.created_at DESC`
    
    const result = await query(ordersQuery, params)
    
    const orders = result.rows.map(row => {
      // Check if this is a legacy order (no items)
      const itemsArray = row.items && Array.isArray(row.items) ? row.items : []
      const hasItems = itemsArray.length > 0 && itemsArray[0] && itemsArray[0].id !== null
      
      let items = []
      if (hasItems) {
        items = itemsArray.map((item: any) => ({
          id: item.id?.toString(),
          productName: item.productName,
          category: item.category || '',
          sizes: item.sizes || [],
          fabricType: item.fabricType || '',
          quantity: item.quantity,
          pricePerPiece: parseFloat(item.pricePerPiece),
          totalAmount: parseFloat(item.totalAmount),
          productImages: item.productImages || [],
        }))
      } else {
        // Legacy format - convert to new format
        items = [{
          productName: row.product_name || '',
          category: 'Custom',
          sizes: row.sizes || [],
          fabricType: row.fabric_type || '',
          quantity: row.quantity || 0,
          pricePerPiece: parseFloat(row.price_per_piece) || 0,
          totalAmount: parseFloat(row.total_amount) || 0,
          productImages: row.product_image ? [row.product_image] : [],
        }]
      }
      
      return {
        id: row.id.toString(),
        date: row.date.toISOString().split('T')[0],
        supplierId: row.supplier_id ? row.supplier_id.toString() : '',
        supplierName: row.supplier_name,
        customPoNumber: row.custom_po_number || '',
        items,
        invoiceImage: row.invoice_image || '',
        subtotal: row.subtotal != null ? parseFloat(row.subtotal) : (row.total_amount ? parseFloat(row.total_amount) : 0),
        gstAmount: row.gst_amount != null ? parseFloat(row.gst_amount) : 0,
        grandTotal: row.grand_total != null ? parseFloat(row.grand_total) : (row.total_amount ? parseFloat(row.total_amount) : 0),
        notes: row.notes || '',
        createdAt: row.created_at.toISOString(),
        // Legacy fields for backward compatibility
        productName: row.product_name,
        productImage: row.product_image || '',
        sizes: row.sizes || [],
        fabricType: row.fabric_type || '',
        quantity: row.quantity,
        pricePerPiece: parseFloat(row.price_per_piece),
        totalAmount: parseFloat(row.total_amount),
      }
    })
    
    // Get unique categories for filter
    const categoriesResult = await query(
      `SELECT DISTINCT category FROM purchase_order_items WHERE category IS NOT NULL UNION 
       SELECT DISTINCT dress_type FROM inventory WHERE dress_type IS NOT NULL`
    )
    const categories = ['All', ...categoriesResult.rows.map((r: any) => r.category || r.dress_type).filter(Boolean)]
    
    return NextResponse.json({ 
      success: true, 
      data: orders,
      categories: Array.from(new Set(categories))
    })
  } catch (error: any) {
    console.error('Purchase orders fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch purchase orders',
        error: error?.message || String(error)
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get supplier GST settings
    let gstType = 'percentage'
    let gstPercentage = 0
    let gstAmountRupees = 0
    
    // Use manual GST override if provided, otherwise use supplier's default
    if (body.gstType) {
      gstType = body.gstType
      gstPercentage = body.gstPercentage || 0
      gstAmountRupees = body.gstAmountRupees || 0
    } else if (body.supplierId) {
      const supplierResult = await query(
        'SELECT gst_type, gst_percentage, gst_amount_rupees FROM suppliers WHERE id = $1',
        [parseInt(body.supplierId)]
      )
      if (supplierResult.rows.length > 0) {
        const supplier = supplierResult.rows[0]
        gstType = supplier.gst_type || 'percentage'
        gstPercentage = parseFloat(supplier.gst_percentage) || 0
        gstAmountRupees = parseFloat(supplier.gst_amount_rupees) || 0
      }
    }
    
    // Calculate totals
    const items = body.items || []
    const subtotal = items.reduce((sum: number, item: any) => sum + (parseFloat(item.totalAmount) || 0), 0)
    let gstAmount = 0
    if (gstType === 'rupees') {
      gstAmount = gstAmountRupees
    } else {
      gstAmount = (subtotal * gstPercentage) / 100
    }
    const grandTotal = subtotal + gstAmount
    
    // Insert purchase order
    const result = await query(
      `INSERT INTO purchase_orders 
       (date, supplier_id, supplier_name, custom_po_number, invoice_image,
        subtotal, gst_amount, grand_total, gst_type, gst_percentage, gst_amount_rupees, notes,
        -- Legacy fields for backward compatibility
        product_name, product_image, sizes, fabric_type, quantity, price_per_piece, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        body.date,
        body.supplierId ? parseInt(body.supplierId) : null,
        body.supplierName,
        body.customPoNumber || null,
        body.invoiceImage || null,
        subtotal,
        gstAmount,
        grandTotal,
        gstType,
        gstPercentage || null,
        gstAmountRupees || null,
        body.notes || null,
        // Legacy fields - use first item or empty
        items.length > 0 ? items[0].productName : '',
        items.length > 0 && items[0].productImages?.length > 0 ? items[0].productImages[0] : null,
        items.length > 0 ? items[0].sizes : [],
        items.length > 0 ? items[0].fabricType : null,
        items.length > 0 ? items[0].quantity : 0,
        items.length > 0 ? items[0].pricePerPiece : 0,
        grandTotal,
      ]
    )
    
    const order = result.rows[0]
    const orderId = order.id
    
    // Insert purchase order items
    for (const item of items) {
      await query(
        `INSERT INTO purchase_order_items 
         (purchase_order_id, product_name, category, sizes, fabric_type, 
          quantity, price_per_piece, total_amount, product_images)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          orderId,
          item.productName,
          item.category || 'Custom',
          item.sizes || [],
          item.fabricType || null,
          item.quantity,
          item.pricePerPiece,
          item.totalAmount,
          item.productImages || [],
        ]
      )
      
      // Auto-add to inventory
      // Normalize product name: trim, remove extra spaces, standardize
      const normalizedProductName = item.productName.trim().replace(/\s+/g, ' ')
      const dressCode = `${normalizedProductName}_${item.fabricType || 'standard'}`.replace(/\s+/g, '_').toUpperCase()
      
      // Try exact match first (by dress_code)
      let existingInventory = await query(
        'SELECT * FROM inventory WHERE dress_code = $1',
        [dressCode]
      )
      
      // If no exact match, try normalized name match (normalize spaces in database too)
      if (existingInventory.rows.length === 0) {
        const normalizedNameLower = normalizedProductName.toLowerCase()
        existingInventory = await query(
          `SELECT * FROM inventory 
           WHERE LOWER(TRIM(REPLACE(dress_name, '  ', ' '))) = $1
           AND (fabric_type = $2 OR (fabric_type IS NULL AND $2 = 'standard'))
           LIMIT 1`,
          [normalizedNameLower, item.fabricType || 'standard']
        )
      }
      
      // If still no match, try partial match on dress_code
      if (existingInventory.rows.length === 0) {
        const searchPattern = `%${normalizedProductName.replace(/\s+/g, '_').toUpperCase()}%`
        existingInventory = await query(
          `SELECT * FROM inventory 
           WHERE LOWER(dress_code) LIKE LOWER($1)
           LIMIT 1`,
          [searchPattern]
        )
      }
      
      if (existingInventory.rows.length > 0) {
        const existing = existingInventory.rows[0]
        const existingSizes = existing.sizes || []
        const newSizes = item.sizes || []
        const mergedSizes = Array.from(new Set([...existingSizes, ...newSizes]))
        
        // Update stock: increase quantity_in and current_stock by the exact purchase order quantity
        const purchaseQuantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 0)
        const currentQuantityIn = parseInt(existing.quantity_in) || 0
        const currentQuantityOut = parseInt(existing.quantity_out) || 0
        const currentStock = parseInt(existing.current_stock) || 0
        const newQuantityIn = currentQuantityIn + purchaseQuantity
        // Maintain relationship: current_stock = quantity_in - quantity_out
        const newCurrentStock = newQuantityIn - currentQuantityOut
        
        // Validate: quantity_in should never be negative
        if (newQuantityIn < 0) {
          console.error(`❌ Invalid stock update for ${item.productName}: quantity_in would be negative (${newQuantityIn}). Skipping.`)
          continue
        }
        
        console.log(`📦 Updating stock for ${item.productName}: Adding ${purchaseQuantity} units (Current: ${currentStock} → New: ${newCurrentStock})`)
        
        // Update dress_code if it doesn't match (normalize it)
        const updateDressCode = existing.dress_code !== dressCode ? dressCode : existing.dress_code
        
        await query(
          `UPDATE inventory 
           SET sizes = $1, 
               dress_code = $2,
               wholesale_price = $3, selling_price = $4,
               fabric_type = COALESCE($5, fabric_type),
               supplier_name = COALESCE($6, supplier_name),
               quantity_in = $7,
               current_stock = $8,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $9`,
          [
            mergedSizes,
            updateDressCode,
            item.pricePerPiece,
            (parseFloat(item.pricePerPiece) * 2).toFixed(2),
            item.fabricType,
            body.supplierName,
            newQuantityIn,
            newCurrentStock,
            existing.id,
          ]
        )
      } else {
        // New inventory item - set initial stock to the exact purchase order quantity
        const purchaseQuantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 0)
        // For new items, quantity_out starts at 0, so current_stock = quantity_in
        console.log(`📦 Creating new inventory item ${item.productName} with initial stock: ${purchaseQuantity}`)
        
        await query(
          `INSERT INTO inventory 
           (dress_name, dress_type, dress_code, sizes, wholesale_price, selling_price,
            image_url, fabric_type, supplier_name, quantity_in, quantity_out, current_stock)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            normalizedProductName, // Use normalized name
            item.category || 'Custom',
            dressCode,
            item.sizes || [],
            item.pricePerPiece,
            (parseFloat(item.pricePerPiece) * 2).toFixed(2),
            item.productImages && item.productImages.length > 0 ? item.productImages[0] : null,
            item.fabricType,
            body.supplierName,
            purchaseQuantity, // quantity_in = purchase order quantity
            0, // quantity_out starts at 0
            purchaseQuantity, // current_stock = quantity_in - quantity_out = purchaseQuantity - 0
          ]
        )
      }
    }
    
    // Fetch the complete order with items
    const orderWithItems = await query(
      `SELECT 
        po.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', poi.id,
              'productName', poi.product_name,
              'category', poi.category,
              'sizes', poi.sizes,
              'fabricType', poi.fabric_type,
              'quantity', poi.quantity,
              'pricePerPiece', poi.price_per_piece,
              'totalAmount', poi.total_amount,
              'productImages', poi.product_images
            )
          ) FILTER (WHERE poi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM purchase_orders po
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      WHERE po.id = $1
      GROUP BY po.id`,
      [orderId]
    )
    
    const newOrder = orderWithItems.rows[0]
    const formattedItems = (newOrder.items || []).map((item: any) => ({
      id: item.id?.toString(),
      productName: item.productName,
      category: item.category || '',
      sizes: item.sizes || [],
      fabricType: item.fabricType || '',
      quantity: item.quantity,
      pricePerPiece: parseFloat(item.pricePerPiece),
      totalAmount: parseFloat(item.totalAmount),
      productImages: item.productImages || [],
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        id: newOrder.id.toString(),
        date: newOrder.date.toISOString().split('T')[0],
        supplierId: newOrder.supplier_id ? newOrder.supplier_id.toString() : '',
        supplierName: newOrder.supplier_name,
        customPoNumber: newOrder.custom_po_number || '',
        items: formattedItems,
        invoiceImage: newOrder.invoice_image || '',
        subtotal: parseFloat(newOrder.subtotal),
        gstAmount: parseFloat(newOrder.gst_amount),
        grandTotal: parseFloat(newOrder.grand_total),
        gstType: newOrder.gst_type || 'percentage',
        gstPercentage: newOrder.gst_percentage != null ? parseFloat(newOrder.gst_percentage) : undefined,
        gstAmountRupees: newOrder.gst_amount_rupees != null ? parseFloat(newOrder.gst_amount_rupees) : undefined,
        notes: newOrder.notes || '',
        createdAt: newOrder.created_at.toISOString(),
      }
    })
  } catch (error) {
    console.error('Purchase order add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add purchase order', error: String(error) },
      { status: 500 }
    )
  }
}
