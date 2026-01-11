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
        { success: false, message: 'Invalid purchase order ID' },
        { status: 400 }
      )
    }
    
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
    
    // Update purchase order
    const result = await query(
      `UPDATE purchase_orders 
       SET date = $1, supplier_id = $2, supplier_name = $3, custom_po_number = $4, 
           invoice_image = $5, subtotal = $6, gst_amount = $7, grand_total = $8, 
           gst_type = $9, gst_percentage = $10, gst_amount_rupees = $11, notes = $12,
           -- Legacy fields
           product_name = $13, product_image = $14, sizes = $15, fabric_type = $16, 
           quantity = $17, price_per_piece = $18, total_amount = $19
       WHERE id = $20
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
        // Legacy fields
        items.length > 0 ? items[0].productName : '',
        items.length > 0 && items[0].productImages?.length > 0 ? items[0].productImages[0] : null,
        items.length > 0 ? items[0].sizes : [],
        items.length > 0 ? items[0].fabricType : null,
        items.length > 0 ? items[0].quantity : 0,
        items.length > 0 ? items[0].pricePerPiece : 0,
        grandTotal,
        id,
      ]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Purchase order not found' },
        { status: 404 }
      )
    }
    
    // Get old quantities BEFORE deleting items - include fabric_type
    const oldItemsResult = await query(
      'SELECT product_name, fabric_type, quantity FROM purchase_order_items WHERE purchase_order_id = $1',
      [id]
    )
    const oldItemsMap = new Map<string, number>()
    oldItemsResult.rows.forEach((row: any) => {
      // Use the old item's fabric_type, not the new item's
      const oldFabricType = row.fabric_type || 'standard'
      const key = `${row.product_name}_${oldFabricType}`.replace(/\s+/g, '_').toUpperCase()
      oldItemsMap.set(key, (oldItemsMap.get(key) || 0) + parseInt(row.quantity))
    })
    
    // Store old items for deleted items handling
    const oldItemsForDeletion = oldItemsResult.rows.map((row: any) => ({
      productName: row.product_name,
      fabricType: row.fabric_type || 'standard',
      quantity: parseInt(row.quantity) || 0
    }))
    
    // Start transaction
    await query('BEGIN')
    
    try {
      // Delete existing items and recreate
      await query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [id])
      
      // Insert updated items
    for (const item of items) {
      await query(
        `INSERT INTO purchase_order_items 
         (purchase_order_id, product_name, category, sizes, fabric_type, 
          quantity, price_per_piece, total_amount, product_images)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
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
      
      // Update inventory
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
        
        // Calculate stock difference: new quantity - old quantity
        const newPurchaseQuantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 0)
        // Use the same dressCode format for lookup
        const oldQuantity = oldItemsMap.get(dressCode) || 0
        const quantityDifference = newPurchaseQuantity - oldQuantity
        
        // Update stock: adjust quantity_in and current_stock based on the exact difference
        const currentQuantityIn = parseInt(existing.quantity_in) || 0
        const currentQuantityOut = parseInt(existing.quantity_out) || 0
        const currentStock = parseInt(existing.current_stock) || 0
        const newQuantityIn = currentQuantityIn + quantityDifference
        // Maintain relationship: current_stock = quantity_in - quantity_out
        const newCurrentStock = newQuantityIn - currentQuantityOut
        
        // Validate: quantity_in should never be negative
        if (newQuantityIn < 0) {
          console.error(`❌ Invalid stock update for ${item.productName}: quantity_in would be negative (${newQuantityIn}). Current: ${currentQuantityIn}, Difference: ${quantityDifference}. Skipping.`)
          continue
        }
        
        console.log(`📦 Updating stock for ${item.productName}: Change ${quantityDifference > 0 ? '+' : ''}${quantityDifference} units (Old PO: ${oldQuantity}, New PO: ${newPurchaseQuantity}, Stock: ${currentStock} → ${newCurrentStock})`)
        
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
        
        // Validate relationship after update
        const calculatedStock = newQuantityIn - currentQuantityOut
        if (newCurrentStock !== calculatedStock) {
          console.warn(`Stock relationship mismatch for inventory ${existing.id}. Expected: ${calculatedStock}, Got: ${newCurrentStock}`)
        }
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
            item.productName,
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
    
    // Handle deleted items - items that were in old list but not in new list
    const newItemsKeys = new Set(
      items.map((item: any) => {
        const fabricType = item.fabricType || 'standard'
        return `${item.productName}_${fabricType}`.replace(/\s+/g, '_').toUpperCase()
      })
    )
    
    for (const oldItem of oldItemsForDeletion) {
      const oldItemKey = `${oldItem.productName}_${oldItem.fabricType}`.replace(/\s+/g, '_').toUpperCase()
      
      // If this old item is not in the new items, we need to subtract its stock
      if (!newItemsKeys.has(oldItemKey)) {
        const dressCode = oldItemKey
        const inventoryResult = await query(
          'SELECT id, quantity_in, quantity_out, current_stock FROM inventory WHERE dress_code = $1',
          [dressCode]
        )
        
        if (inventoryResult.rows.length > 0) {
          const inventory = inventoryResult.rows[0]
          const currentQuantityIn = parseInt(inventory.quantity_in) || 0
          const currentQuantityOut = parseInt(inventory.quantity_out) || 0
          const currentStock = parseInt(inventory.current_stock) || 0
          const quantityToSubtract = oldItem.quantity
          
          const newQuantityIn = Math.max(0, currentQuantityIn - quantityToSubtract)
          // Maintain relationship: current_stock = quantity_in - quantity_out
          const newCurrentStock = Math.max(0, newQuantityIn - currentQuantityOut)
          
          // Validate: quantity_in should never be negative (already handled by Math.max, but log if it would be)
          if (currentQuantityIn - quantityToSubtract < 0) {
            console.warn(`⚠️  Warning: Deleting item ${oldItem.productName} would make quantity_in negative. Clamping to 0.`)
          }
          
          console.log(`📦 Removing stock for deleted item ${oldItem.productName}: Subtracting ${quantityToSubtract} units (Stock: ${currentStock} → ${newCurrentStock})`)
          
          await query(
            `UPDATE inventory 
             SET quantity_in = $1, 
                 current_stock = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [newQuantityIn, newCurrentStock, inventory.id]
          )
        }
      }
    }
    
      // Commit transaction
      await query('COMMIT')
    } catch (transactionError) {
      // Rollback transaction on error
      await query('ROLLBACK').catch((rollbackError) => {
        console.error('Error rolling back transaction:', rollbackError)
      })
      throw transactionError
    }
    
    // Fetch updated order with items
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
      [id]
    )
    
    const updatedOrder = orderWithItems.rows[0]
    const formattedItems = (updatedOrder.items || []).map((item: any) => ({
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
        id: updatedOrder.id.toString(),
        date: updatedOrder.date.toISOString().split('T')[0],
        supplierId: updatedOrder.supplier_id ? updatedOrder.supplier_id.toString() : '',
        supplierName: updatedOrder.supplier_name,
        customPoNumber: updatedOrder.custom_po_number || '',
        items: formattedItems,
        invoiceImage: updatedOrder.invoice_image || '',
        subtotal: parseFloat(updatedOrder.subtotal),
        gstAmount: parseFloat(updatedOrder.gst_amount),
        grandTotal: parseFloat(updatedOrder.grand_total),
        gstType: updatedOrder.gst_type || 'percentage',
        gstPercentage: updatedOrder.gst_percentage != null ? parseFloat(updatedOrder.gst_percentage) : undefined,
        gstAmountRupees: updatedOrder.gst_amount_rupees != null ? parseFloat(updatedOrder.gst_amount_rupees) : undefined,
        notes: updatedOrder.notes || '',
        createdAt: updatedOrder.created_at.toISOString(),
      }
    })
  } catch (error: any) {
    // Rollback transaction on error
    await query('ROLLBACK').catch((rollbackError) => {
      console.error('Error rolling back transaction:', rollbackError)
    })
    console.error('Purchase order update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update purchase order',
        error: error?.message || String(error)
      },
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
        { success: false, message: 'Invalid purchase order ID' },
        { status: 400 }
      )
    }
    
    // Get items before deleting to adjust stock
    const itemsResult = await query(
      'SELECT product_name, quantity, fabric_type FROM purchase_order_items WHERE purchase_order_id = $1',
      [id]
    )
    
    // Delete items first (cascade should handle this, but being explicit)
    await query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [id])
    
    const result = await query('DELETE FROM purchase_orders WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Purchase order not found' },
        { status: 404 }
      )
    }
    
    // Decrease stock for each item that was in the purchase order
    for (const item of itemsResult.rows) {
      const dressCode = `${item.product_name}_${item.fabric_type || 'standard'}`.replace(/\s+/g, '_').toUpperCase()
      
      const inventoryResult = await query(
        'SELECT id, quantity_in, current_stock FROM inventory WHERE dress_code = $1',
        [dressCode]
      )
      
      if (inventoryResult.rows.length > 0) {
        const inventory = inventoryResult.rows[0]
        const currentQuantityIn = parseInt(inventory.quantity_in) || 0
        const currentStock = parseInt(inventory.current_stock) || 0
        const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 0)
        
        const newQuantityIn = Math.max(0, currentQuantityIn - quantity)
        const newCurrentStock = Math.max(0, currentStock - quantity)
        
        await query(
          `UPDATE inventory 
           SET quantity_in = $1, 
               current_stock = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [newQuantityIn, newCurrentStock, inventory.id]
        )
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Purchase order delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete purchase order' },
      { status: 500 }
    )
  }
}
