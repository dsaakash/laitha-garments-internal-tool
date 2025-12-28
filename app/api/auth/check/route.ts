import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { decodeBase64 } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('admin_session')
    
    if (!session || !session.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Decode session token to get admin ID
    try {
      let decoded: string
      try {
        decoded = decodeBase64(session.value)
      } catch (decodeError) {
        // Invalid base64 - likely old session format, clear it
        console.log('Invalid session token format, clearing cookie')
        const response = NextResponse.json({ authenticated: false }, { status: 401 })
        response.cookies.delete('admin_session')
        return response
      }
      
      // Check if decoded value is valid
      if (!decoded || decoded.trim() === '') {
        const response = NextResponse.json({ authenticated: false }, { status: 401 })
        response.cookies.delete('admin_session')
        return response
      }
      
      const parts = decoded.split(':')
      
      // Check if we have at least one part (admin ID)
      if (parts.length === 0 || !parts[0] || parts[0].trim() === '') {
        const response = NextResponse.json({ authenticated: false }, { status: 401 })
        response.cookies.delete('admin_session')
        return response
      }
      
      const adminId = parts[0].trim()
      
      // Validate admin ID is a valid number
      const adminIdNum = parseInt(adminId, 10)
      if (isNaN(adminIdNum) || adminIdNum <= 0 || !Number.isInteger(adminIdNum)) {
        // Invalid admin ID format - clear the cookie
        console.log('Invalid admin ID from session:', adminId, 'decoded:', decoded)
        const response = NextResponse.json({ authenticated: false }, { status: 401 })
        response.cookies.delete('admin_session')
        return response
      }
      
      // Verify admin still exists in database
      const result = await query(
        'SELECT id, email, name FROM admins WHERE id = $1',
        [adminIdNum]
      )
      
      if (result.rows.length > 0) {
        return NextResponse.json({ 
          authenticated: true,
          admin: result.rows[0]
        })
      } else {
        // Admin not found - clear the cookie
        const response = NextResponse.json({ authenticated: false }, { status: 401 })
        response.cookies.delete('admin_session')
        return response
      }
    } catch (e) {
      // Invalid session token - clear it
      console.error('Session decode error:', e)
      const response = NextResponse.json({ authenticated: false }, { status: 401 })
      response.cookies.delete('admin_session')
      return response
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
