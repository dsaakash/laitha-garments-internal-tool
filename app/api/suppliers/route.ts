import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(`
      SELECT s.*, 
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
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `)
    
    const suppliers = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      phone: row.phone,
      email: row.email || '',
      address: row.address || '',
      gstNumber: row.gst_number || '',
      gstPercentage: row.gst_percentage ? parseFloat(row.gst_percentage) : 0,
      gstAmountRupees: row.gst_amount_rupees ? parseFloat(row.gst_amount_rupees) : 0,
      gstType: row.gst_type || 'percentage',
      contacts: row.contacts || [],
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }))
    
    return NextResponse.json({ success: true, data: suppliers })
  } catch (error) {
    console.error('Suppliers fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Insert supplier
    const result = await query(
      `INSERT INTO suppliers (name, phone, email, address, gst_number, gst_percentage, gst_amount_rupees, gst_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
      ]
    )
    
    const supplier = result.rows[0]
    const supplierId = supplier.id
    
    // Insert contact persons
    if (body.contacts && body.contacts.length > 0) {
      for (const contact of body.contacts) {
        await query(
          `INSERT INTO supplier_contacts (supplier_id, contact_name, phone, whatsapp_number, is_primary)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            supplierId,
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
      [supplierId]
    )
    
    const newSupplier = completeSupplier.rows[0]
    const formattedSupplier = {
      id: newSupplier.id.toString(),
      name: newSupplier.name,
      phone: newSupplier.phone,
      email: newSupplier.email || '',
      address: newSupplier.address || '',
      gstNumber: newSupplier.gst_number || '',
      gstPercentage: newSupplier.gst_percentage ? parseFloat(newSupplier.gst_percentage) : 0,
      gstAmountRupees: newSupplier.gst_amount_rupees ? parseFloat(newSupplier.gst_amount_rupees) : 0,
      gstType: newSupplier.gst_type || 'percentage',
      contacts: newSupplier.contacts || [],
      createdAt: newSupplier.created_at.toISOString(),
      updatedAt: newSupplier.updated_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: formattedSupplier })
  } catch (error) {
    console.error('Supplier add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add supplier' },
      { status: 500 }
    )
  }
}

