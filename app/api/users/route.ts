import { NextRequest, NextResponse } from 'next/server'
import { createUser, getAllUsers, deleteUser } from '@/lib/db-auth'
import { getUserByEmail } from '@/lib/db-auth'
import { getCurrentUserRole, hasPermission } from '@/lib/rbac'
import { decodeBase64 } from '@/lib/utils'

// Get all users
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

    // Check if user has permission to view users (admin and superadmin)
    try {
      const decoded = decodeBase64(session.value)
      const adminId = parseInt(decoded.split(':')[0])
      const role = await getCurrentUserRole(adminId)
      
      if (!role || !hasPermission(role, 'users', 'read')) {
        return NextResponse.json(
          { success: false, message: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      )
    }

    const users = await getAllUsers()
    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// Create new user
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

    // Check if user has permission to create users (admin and superadmin)
    try {
      const decoded = decodeBase64(session.value)
      const adminId = parseInt(decoded.split(':')[0])
      const role = await getCurrentUserRole(adminId)
      
      if (!role || !hasPermission(role, 'users', 'write')) {
        return NextResponse.json(
          { success: false, message: 'Insufficient permissions to create users' },
          { status: 403 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
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

    // Check if user already exists
    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const user = await createUser(email, password, name)
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Create user error:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      stack: error?.stack
    })
    
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    if (error.code === '42P01') { // Table does not exist
      return NextResponse.json(
        { success: false, message: 'Users table does not exist. Please run the migration: npm run migrate-roles' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: error?.message || 'Server error',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

// Delete user
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

    // Check if user has permission to delete users (admin and superadmin)
    try {
      const decoded = decodeBase64(session.value)
      const adminId = parseInt(decoded.split(':')[0])
      const role = await getCurrentUserRole(adminId)
      
      if (!role || !hasPermission(role, 'users', 'delete')) {
        return NextResponse.json(
          { success: false, message: 'Insufficient permissions to delete users' },
          { status: 403 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    const deleted = await deleteUser(parseInt(id))
    
    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'User deleted successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
