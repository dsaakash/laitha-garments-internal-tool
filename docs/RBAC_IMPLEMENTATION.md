# RBAC (Role-Based Access Control) Implementation

## Overview

This document describes the Role-Based Access Control (RBAC) system implemented for the Lalitha Garments Internal Tool. The system supports three roles: **superadmin**, **admin**, and **user**.

## Roles and Permissions

### Superadmin
- **Full access** to all features
- Can create, edit, and delete admins
- Can manage all aspects of the system
- Can access Admin Management page

### Admin
- Can manage suppliers, purchases, inventory, customers, catalogues, sales, and invoices
- Can view admins and users (read-only)
- Can create and manage regular users
- Cannot create or delete admins
- Cannot access Admin Management page

### User
- Can only view catalogues and products
- Limited to read-only access
- Cannot access admin features

## Database Schema

### Admins Table
The `admins` table has been updated to include a `role` column:
```sql
ALTER TABLE admins ADD COLUMN role VARCHAR(50) DEFAULT 'admin' 
CHECK (role IN ('superadmin', 'admin', 'user'));
```

### Users Table
A new `users` table has been created for regular users:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Running the Migration

1. **Run the migration script:**
   ```bash
   node scripts/run-migration.js
   ```

   Or manually run the SQL:
   ```bash
   psql $DATABASE_URL -f scripts/add-roles-migration.sql
   ```

2. **Verify the migration:**
   - Check that the `role` column exists in the `admins` table
   - Check that the `users` table has been created
   - The first admin should be automatically set to `superadmin`

## Features

### Admin Management Page (`/admin/admins`)
- **Access**: Only superadmin
- **Features**:
  - View all admins with their roles
  - Create new admins with specified roles
  - Edit admin roles
  - Delete admins (cannot delete yourself)

### User Management Page (`/admin/users`)
- **Access**: Superadmin and admin
- **Features**:
  - View all regular users
  - Create new users (who can only view catalogues)
  - Delete users

### Sidebar Navigation
The sidebar automatically filters menu items based on the user's role:
- **Superadmin**: Sees all menu items including "Admin Management"
- **Admin**: Sees all menu items except "Admin Management"
- **User**: Only sees "Catalogues"

## API Endpoints

### Admin Management
- `GET /api/admin` - Get all admins (requires read permission)
- `POST /api/admin` - Create admin (requires superadmin)
- `PUT /api/admin` - Update admin role (requires superadmin)
- `DELETE /api/admin` - Delete admin (requires superadmin)

### User Management
- `GET /api/users` - Get all users (requires admin or superadmin)
- `POST /api/users` - Create user (requires admin or superadmin)
- `DELETE /api/users` - Delete user (requires admin or superadmin)

## RBAC Library

The RBAC logic is implemented in `lib/rbac.ts`:

```typescript
// Check if user has permission
hasPermission(role: Role, resource: string, action: Permission['action']): boolean

// Check if user can access a route
canAccessRoute(role: Role, route: string): boolean

// Get current user's role
getCurrentUserRole(adminId: number): Promise<Role | null>
```

## Security Notes

1. **Password Security**: All passwords are hashed using bcrypt
2. **Session Management**: Sessions include role information
3. **Permission Checks**: All API endpoints check permissions before executing
4. **Self-Protection**: Users cannot delete their own admin account

## Next Steps

1. **User Login Page**: Create a separate login page for regular users (not yet implemented)
2. **Route Protection**: Add middleware to protect routes based on roles
3. **Audit Logging**: Consider adding audit logs for admin/user management actions

## Troubleshooting

### Migration Issues
If the migration fails:
1. Check database connection: `echo $DATABASE_URL`
2. Verify you have admin privileges on the database
3. Check if the `role` column already exists

### Permission Issues
If you're getting "Insufficient permissions" errors:
1. Check your role in the database: `SELECT id, email, role FROM admins WHERE email = 'your@email.com'`
2. Ensure you're logged in as superadmin for admin management
3. Clear browser cookies and log in again
