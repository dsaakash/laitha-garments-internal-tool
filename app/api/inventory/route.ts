import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplier = searchParams.get('supplier')
    
    let queryText = 'SELECT * FROM inventory'
    const params: any[] = []
    
    if (supplier && supplier !== 'All') {
      queryText += ' WHERE supplier_name = $1'
      params.push(supplier)
    }
    
    queryText += ' ORDER BY created_at DESC'
    
    const result = await query(queryText, params.length > 0 ? params : undefined)
    
    // Get unique suppliers for filter dropdown
    const suppliersResult = await query(
      'SELECT DISTINCT supplier_name FROM inventory WHERE supplier_name IS NOT NULL AND supplier_name != \'\' ORDER BY supplier_name'
    )
    const suppliers = suppliersResult.rows.map((row: any) => row.supplier_name).filter(Boolean)
    
    const items = result.rows.map(row => ({
      id: row.id.toString(),
      dressName: row.dress_name,
      dressType: row.dress_type,
      dressCode: row.dress_code,
      sizes: row.sizes || [],
      wholesalePrice: parseFloat(row.wholesale_price),
      sellingPrice: parseFloat(row.selling_price),
      pricingUnit: row.pricing_unit || undefined,
      pricePerPiece: row.price_per_piece ? parseFloat(row.price_per_piece) : undefined,
      pricePerMeter: row.price_per_meter ? parseFloat(row.price_per_meter) : undefined,
      imageUrl: row.image_url || '',
      productImages: row.product_images ? (Array.isArray(row.product_images) ? row.product_images : JSON.parse(row.product_images)) : (row.image_url ? [row.image_url] : []),
      fabricType: row.fabric_type || '',
      supplierName: row.supplier_name || '',
      supplierAddress: row.supplier_address || '',
      supplierPhone: row.supplier_phone || '',
      quantityIn: row.quantity_in ? parseInt(row.quantity_in) : 0,
      quantityOut: row.quantity_out ? parseInt(row.quantity_out) : 0,
      currentStock: row.current_stock ? parseInt(row.current_stock) : 0,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }))
    
    return NextResponse.json({ 
      success: true, 
      data: items,
      suppliers: suppliers
    })
  } catch (error) {
    console.error('Inventory fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const productImages = body.productImages && body.productImages.length > 0 
      ? JSON.stringify(body.productImages) 
      : (body.imageUrl ? JSON.stringify([body.imageUrl]) : null)
    
    const result = await query(
      `INSERT INTO inventory 
       (dress_name, dress_type, dress_code, sizes, wholesale_price, selling_price, 
        pricing_unit, price_per_piece, price_per_meter, image_url, product_images, fabric_type, supplier_name, supplier_address, supplier_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        body.dressName,
        body.dressType,
        body.dressCode,
        body.sizes || [],
        body.wholesalePrice,
        body.sellingPrice,
        body.pricingUnit || null,
        body.pricePerPiece || null,
        body.pricePerMeter || null,
        body.imageUrl || null,
        productImages,
        body.fabricType || null,
        body.supplierName || null,
        body.supplierAddress || null,
        body.supplierPhone || null,
      ]
    )
    
    const item = result.rows[0]
    const newItem = {
      id: item.id.toString(),
      dressName: item.dress_name,
      dressType: item.dress_type,
      dressCode: item.dress_code,
      sizes: item.sizes || [],
      wholesalePrice: parseFloat(item.wholesale_price),
      sellingPrice: parseFloat(item.selling_price),
      pricingUnit: item.pricing_unit || undefined,
      pricePerPiece: item.price_per_piece ? parseFloat(item.price_per_piece) : undefined,
      pricePerMeter: item.price_per_meter ? parseFloat(item.price_per_meter) : undefined,
      imageUrl: item.image_url || '',
      productImages: item.product_images ? (Array.isArray(item.product_images) ? item.product_images : JSON.parse(item.product_images)) : (item.image_url ? [item.image_url] : []),
      fabricType: item.fabric_type || '',
      supplierName: item.supplier_name || '',
      supplierAddress: item.supplier_address || '',
      supplierPhone: item.supplier_phone || '',
      quantityIn: item.quantity_in ? parseInt(item.quantity_in) : 0,
      quantityOut: item.quantity_out ? parseInt(item.quantity_out) : 0,
      currentStock: item.current_stock ? parseInt(item.current_stock) : 0,
      createdAt: item.created_at.toISOString(),
      updatedAt: item.updated_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: newItem })
  } catch (error) {
    console.error('Inventory add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add inventory item' },
      { status: 500 }
    )
  }
}
