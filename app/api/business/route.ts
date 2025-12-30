import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM business_profile ORDER BY id DESC LIMIT 1'
    )
    
    if (result.rows.length > 0) {
      const profile = result.rows[0]
      return NextResponse.json({ 
        success: true, 
        data: {
          businessName: profile.business_name,
          ownerName: profile.owner_name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          gstNumber: profile.gst_number || '',
          whatsappNumber: profile.whatsapp_number,
        }
      })
    }
    
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Business profile fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch business profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if profile already exists
    const existing = await query(
      'SELECT id FROM business_profile ORDER BY id DESC LIMIT 1'
    )
    
    if (existing.rows.length > 0) {
      // Update existing profile
      const result = await query(
        `UPDATE business_profile 
         SET business_name = $1, owner_name = $2, email = $3, phone = $4, 
             address = $5, gst_number = $6, whatsapp_number = $7, 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [
          body.businessName,
          body.ownerName,
          body.email,
          body.phone,
          body.address,
          body.gstNumber || null,
          body.whatsappNumber,
          existing.rows[0].id
        ]
      )
      
      const profile = result.rows[0]
      return NextResponse.json({ 
        success: true, 
        data: {
          businessName: profile.business_name,
          ownerName: profile.owner_name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          gstNumber: profile.gst_number || '',
          whatsappNumber: profile.whatsapp_number,
        }
      })
    } else {
      // Insert new profile
      const result = await query(
        `INSERT INTO business_profile 
         (business_name, owner_name, email, phone, address, gst_number, whatsapp_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          body.businessName,
          body.ownerName,
          body.email,
          body.phone,
          body.address,
          body.gstNumber || null,
          body.whatsappNumber
        ]
      )
      
      const profile = result.rows[0]
      return NextResponse.json({ 
        success: true, 
        data: {
          businessName: profile.business_name,
          ownerName: profile.owner_name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          gstNumber: profile.gst_number || '',
          whatsappNumber: profile.whatsapp_number,
        }
      })
    }
  } catch (error) {
    console.error('Business profile update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update business profile' },
      { status: 500 }
    )
  }
}
