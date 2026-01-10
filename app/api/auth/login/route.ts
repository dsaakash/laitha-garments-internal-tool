import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, verifyUser } from '@/lib/db-auth'
import { encodeBase64, getNodeEnv } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // First try to verify as admin
    let admin = await verifyAdmin(email, password)
    let user = null
    let userType: 'admin' | 'user' = 'admin'

    if (admin) {
      // Admin login successful
      userType = 'admin'
    } else {
      // If not admin, try to verify as regular user
      user = await verifyUser(email, password)
      if (user) {
        userType = 'user'
      }
    }

    if (admin || user) {
      const userId = admin ? admin.id : user!.id
      const userName = admin ? admin.name : user!.name
      const userRole = admin ? admin.role : user!.role
      
      // Create a simple session token (in production, use proper JWT)
      // Include user type in token: admin_id or user_id
      const sessionToken = encodeBase64(`${userType}:${userId}:${email}:${Date.now()}`)
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'Login successful',
        admin: {
          id: userId,
          email: email,
          name: userName,
          role: userRole,
          type: userType
        }
      })
      
      // Set cookie for session
      response.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: getNodeEnv() === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      return response
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    
    // Provide more specific error messages for debugging
    let errorMessage = 'Server error'
    if (error instanceof Error) {
      if (error.message.includes('DATABASE_URL')) {
        errorMessage = 'Database configuration error. Please check your environment variables.'
      } else if (error.message.includes('connect') || error.message.includes('connection')) {
        errorMessage = 'Database connection error. Please check your database settings.'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    )
  }
}
