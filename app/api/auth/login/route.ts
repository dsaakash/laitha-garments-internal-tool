import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/db-auth'
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

    const admin = await verifyAdmin(email, password)

    if (admin) {
      // Create a simple session token (in production, use proper JWT)
      const sessionToken = encodeBase64(`${admin.id}:${email}:${Date.now()}`)
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'Login successful',
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name
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
