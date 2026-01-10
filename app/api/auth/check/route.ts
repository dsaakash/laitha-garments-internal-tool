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
      
      let userType: string
      let userId: string
      
      // Handle both old format (adminId:email:timestamp) and new format (userType:userId:email:timestamp)
      if (parts.length >= 2) {
        // Check if first part is 'admin' or 'user' (new format)
        if (parts[0] === 'admin' || parts[0] === 'user') {
          userType = parts[0].trim()
          userId = parts[1].trim()
        } else {
          // Old format: adminId:email:timestamp (backward compatibility)
          userType = 'admin'
          userId = parts[0].trim()
        }
      } else {
        // Invalid format
        const response = NextResponse.json({ authenticated: false }, { status: 401 })
        response.cookies.delete('admin_session')
        return response
      }
      
      // Validate user ID is a valid number
      const userIdNum = parseInt(userId, 10)
      if (isNaN(userIdNum) || userIdNum <= 0 || !Number.isInteger(userIdNum)) {
        // Invalid user ID format - clear the cookie
        console.log('Invalid user ID from session:', userId, 'decoded:', decoded)
        const response = NextResponse.json({ authenticated: false }, { status: 401 })
        response.cookies.delete('admin_session')
        return response
      }
      
      // Verify user still exists in database (check admins or users table based on type)
      let result
      if (userType === 'user') {
        result = await query(
          'SELECT id, email, name, role FROM users WHERE id = $1',
          [userIdNum]
        )
      } else {
        // Default to admin (backward compatibility with old sessions)
        result = await query(
          'SELECT id, email, name, role FROM admins WHERE id = $1',
          [userIdNum]
        )
      }
      
      if (result.rows.length > 0) {
        return NextResponse.json({ 
          authenticated: true,
          admin: result.rows[0] // Keep 'admin' key for backward compatibility
        })
      } else {
        // User not found - clear the cookie
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
