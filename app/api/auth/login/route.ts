import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = 'savantaakash322@gmail.com'
const ADMIN_PASSWORD = 'Aakash@9353'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Create a simple session token (in production, use proper JWT)
      const sessionToken = Buffer.from(`${email}:${Date.now()}`).toString('base64')
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'Login successful' 
      })
      
      // Set cookie for session
      response.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
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
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

