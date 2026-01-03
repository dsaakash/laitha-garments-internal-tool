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
        { success: false, message: 'Invalid supplier ID' },
        { status: 400 }
      )
    }
    
    // Update supplier
    const result = await query(
      `UPDATE suppliers 
       SET name = $1, phone = $2, email = $3, address = $4, 
           gst_number = $5, gst_percentage = $6, gst_amount_rupees = $7, gst_type = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        body.name,
        body.phone,
        body.email || null,
        body.address || null,
        body.gstNumber || null,
        body.gstPercentage || 0,
        body.gstAmountRupees || 0,
        body.gstType || 'percentage',
        id,
      ]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Supplier not found' },
        { status: 404 }
      )
    }
    
    // Delete existing contacts and insert new ones
    await query('DELETE FROM supplier_contacts WHERE supplier_id = $1', [id])
    
    if (body.contacts && body.contacts.length > 0) {
      for (const contact of body.contacts) {
        await query(
          `INSERT INTO supplier_contacts (supplier_id, contact_name, phone, whatsapp_number, is_primary)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            id,
            contact.contactName,
            contact.phone,
            contact.whatsappNumber || null,
            contact.isPrimary || false,
          ]
        )
      }
    }
    
    // Fetch complete supplier with contacts
    const completeSupplier = await query(
      `SELECT s.*, 
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', sc.id::text,
                    'contactName', sc.contact_name,
                    'phone', sc.phone,
                    'whatsappNumber', sc.whatsapp_number,
                    'isPrimary', sc.is_primary
                  )
                ) FILTER (WHERE sc.id IS NOT NULL),
                '[]'::json
              ) as contacts
       FROM suppliers s
       LEFT JOIN supplier_contacts sc ON s.id = sc.supplier_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    )
    
    const supplier = completeSupplier.rows[0]
    const updatedSupplier = {
      id: supplier.id.toString(),
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      gstNumber: supplier.gst_number || '',
      gstPercentage: supplier.gst_percentage ? parseFloat(supplier.gst_percentage) : 0,
      gstAmountRupees: supplier.gst_amount_rupees ? parseFloat(supplier.gst_amount_rupees) : 0,
      gstType: supplier.gst_type || 'percentage',
      contacts: supplier.contacts || [],
      createdAt: supplier.created_at.toISOString(),
      updatedAt: supplier.updated_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: updatedSupplier })
  } catch (error) {
    console.error('Supplier update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update supplier' },
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
        { success: false, message: 'Invalid supplier ID' },
        { status: 400 }
      )
    }
    
    const result = await query('DELETE FROM suppliers WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Supplier not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Supplier delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}

