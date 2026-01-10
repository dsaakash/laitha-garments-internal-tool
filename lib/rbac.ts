import { getAdminById } from './db-auth'

export type Role = 'superadmin' | 'admin' | 'user'

export interface Permission {
  resource: string
  action: 'read' | 'write' | 'delete' | 'manage'
}

// Define role-based permissions
const rolePermissions: Record<Role, Permission[]> = {
  superadmin: [
    { resource: '*', action: 'manage' }, // Full access to everything
  ],
  admin: [
    { resource: 'dashboard', action: 'read' },
    { resource: 'suppliers', action: 'write' },
    { resource: 'purchases', action: 'write' },
    { resource: 'inventory', action: 'write' },
    { resource: 'customers', action: 'write' },
    { resource: 'catalogues', action: 'write' },
    { resource: 'sales', action: 'write' },
    { resource: 'invoices', action: 'write' },
    { resource: 'business', action: 'write' },
    { resource: 'admins', action: 'read' }, // Can view but not manage
    { resource: 'users', action: 'read' }, // Can view but not manage
  ],
  user: [
    { resource: 'catalogues', action: 'read' }, // Can only view catalogues
    { resource: 'products', action: 'read' }, // Can view products in catalogues
  ],
}

export function hasPermission(role: Role, resource: string, action: Permission['action']): boolean {
  const permissions = rolePermissions[role] || []
  
  // Check for wildcard permission (superadmin)
  if (permissions.some(p => p.resource === '*' && p.action === 'manage')) {
    return true
  }
  
  // Check for specific resource permission
  const resourcePermission = permissions.find(p => p.resource === resource)
  if (!resourcePermission) {
    return false
  }
  
  // Check action level
  const actionHierarchy: Record<Permission['action'], number> = {
    read: 1,
    write: 2,
    delete: 3,
    manage: 4,
  }
  
  return actionHierarchy[resourcePermission.action] >= actionHierarchy[action]
}

export function canAccessRoute(role: Role, route: string): boolean {
  // Map routes to resources
  const routeMap: Record<string, string> = {
    '/admin/dashboard': 'dashboard',
    '/admin/suppliers': 'suppliers',
    '/admin/purchases': 'purchases',
    '/admin/inventory': 'inventory',
    '/admin/customers': 'customers',
    '/admin/catalogues': 'catalogues',
    '/admin/sales': 'sales',
    '/admin/invoices': 'invoices',
    '/admin/business': 'business',
    '/admin/admins': 'admins',
    '/admin/users': 'users',
    '/admin/setup': 'dashboard', // Setup wizard requires dashboard access
  }
  
  const resource = routeMap[route] || route
  return hasPermission(role, resource, 'read')
}

export async function getCurrentUserRole(adminId: number): Promise<Role | null> {
  try {
    const admin = await getAdminById(adminId)
    return admin?.role || null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}
