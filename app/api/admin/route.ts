import { NextRequest, NextResponse } from 'next/server'
import { createAdmin, getAllAdmins, deleteAdmin } from '@/lib/db-auth'
import { verifyAdmin } from '@/lib/db-auth'

// Get all admins
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = request.cookies.get('admin_session')
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const admins = await getAllAdmins()
    return NextResponse.json({ success: true, admins })
  } catch (error) {
    console.error('Get admins error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// Create new admin
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = request.cookies.get('admin_session')
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if admin already exists
    const existing = await verifyAdmin(email, password)
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Admin with this email already exists' },
        { status: 400 }
      )
    }

    const admin = await createAdmin(email, password, name)
    
    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    })
  } catch (error: any) {
    console.error('Create admin error:', error)
    
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { success: false, message: 'Admin with this email already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// Delete admin
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const session = request.cookies.get('admin_session')
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Admin ID is required' },
        { status: 400 }
      )
    }

    const deleted = await deleteAdmin(parseInt(id))
    
    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Admin deleted successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Delete admin error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

