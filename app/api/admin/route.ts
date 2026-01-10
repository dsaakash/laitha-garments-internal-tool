import { NextRequest, NextResponse } from 'next/server'
import { createAdmin, getAllAdmins, deleteAdmin, getAdminById, updateAdminRole } from '@/lib/db-auth'
import { verifyAdmin, getAdminByEmail } from '@/lib/db-auth'
import { getCurrentUserRole, hasPermission } from '@/lib/rbac'
import { decodeBase64 } from '@/lib/utils'

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

    // Check if user has permission to view admins
    try {
      const decoded = decodeBase64(session.value)
      const adminId = parseInt(decoded.split(':')[0])
      const role = await getCurrentUserRole(adminId)
      
      if (!role || !hasPermission(role, 'admins', 'read')) {
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

    // Check if user has permission to create admins (only superadmin)
    try {
      const decoded = decodeBase64(session.value)
      const adminId = parseInt(decoded.split(':')[0])
      const role = await getCurrentUserRole(adminId)
      
      if (!role || !hasPermission(role, 'admins', 'write')) {
        return NextResponse.json(
          { success: false, message: 'Only superadmin can create admins' },
          { status: 403 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      )
    }

    const { email, password, name, role } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRole = role && ['superadmin', 'admin', 'user'].includes(role) ? role : 'admin'

    // Check if admin already exists
    const existing = await getAdminByEmail(email)
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Admin with this email already exists' },
        { status: 400 }
      )
    }

    const admin = await createAdmin(email, password, name, validRole as 'superadmin' | 'admin' | 'user')
    
    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
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

    // Check if user has permission to delete admins (only superadmin)
    try {
      const decoded = decodeBase64(session.value)
      const adminId = parseInt(decoded.split(':')[0])
      const role = await getCurrentUserRole(adminId)
      
      if (!role || !hasPermission(role, 'admins', 'delete')) {
        return NextResponse.json(
          { success: false, message: 'Only superadmin can delete admins' },
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
        { success: false, message: 'Admin ID is required' },
        { status: 400 }
      )
    }

    const adminIdToDelete = parseInt(id)
    
    // Prevent deleting yourself
    try {
      const decoded = decodeBase64(session.value)
      const currentAdminId = parseInt(decoded.split(':')[0])
      if (currentAdminId === adminIdToDelete) {
        return NextResponse.json(
          { success: false, message: 'Cannot delete your own account' },
          { status: 400 }
        )
      }
    } catch (error) {
      // Ignore if session decode fails
    }

    const deleted = await deleteAdmin(adminIdToDelete)
    
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

// Update admin role
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const session = request.cookies.get('admin_session')
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to update admins (only superadmin)
    try {
      const decoded = decodeBase64(session.value)
      const adminId = parseInt(decoded.split(':')[0])
      const role = await getCurrentUserRole(adminId)
      
      if (!role || !hasPermission(role, 'admins', 'write')) {
        return NextResponse.json(
          { success: false, message: 'Only superadmin can update admin roles' },
          { status: 403 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      )
    }

    const { id, role } = await request.json()

    if (!id || !role) {
      return NextResponse.json(
        { success: false, message: 'Admin ID and role are required' },
        { status: 400 }
      )
    }

    if (!['superadmin', 'admin', 'user'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      )
    }

    const updated = await updateAdminRole(parseInt(id), role as 'superadmin' | 'admin' | 'user')
    
    if (updated) {
      return NextResponse.json({
        success: true,
        message: 'Admin role updated successfully',
        admin: updated
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Update admin error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
