import { query } from './db'
import bcrypt from 'bcryptjs'

export interface Admin {
  id: number
  email: string
  name?: string
  role: 'superadmin' | 'admin' | 'user'
  created_at: Date
  updated_at: Date
}

export interface User {
  id: number
  email: string
  name?: string
  role: 'user'
  created_at: Date
  updated_at: Date
}

// Hash password using bcrypt
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

// Verify password using bcrypt
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

export async function createAdmin(email: string, password: string, name?: string, role: 'superadmin' | 'admin' | 'user' = 'admin'): Promise<Admin> {
  const passwordHash = await hashPassword(password)
  
  const result = await query(
    'INSERT INTO admins (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at, updated_at',
    [email, passwordHash, name || null, role]
  )
  
  return result.rows[0]
}

export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const passwordHash = await hashPassword(password)
  
  const result = await query(
    'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at, updated_at',
    [email, passwordHash, name || null, 'user']
  )
  
  return result.rows[0]
}

export async function getAdminByEmail(email: string): Promise<(Admin & { password_hash: string }) | null> {
  const result = await query(
    'SELECT id, email, password_hash, name, role, created_at, updated_at FROM admins WHERE email = $1',
    [email]
  )
  
  return result.rows[0] || null
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const result = await query(
    'SELECT id, email, password_hash, name, role, created_at, updated_at FROM users WHERE email = $1',
    [email]
  )
  
  return result.rows[0] || null
}

export async function getAdminById(id: number): Promise<Admin | null> {
  const result = await query(
    'SELECT id, email, name, role, created_at, updated_at FROM admins WHERE id = $1',
    [id]
  )
  
  return result.rows[0] || null
}

export async function verifyAdmin(email: string, password: string): Promise<Admin | null> {
  const admin = await getAdminByEmail(email)
  
  if (!admin) {
    return null
  }
  
  const isValid = await verifyPassword(password, admin.password_hash)
  
  if (!isValid) {
    return null
  }
  
  // Return admin without password
  const { password_hash, ...adminWithoutPassword } = admin
  return adminWithoutPassword
}

export async function getAllAdmins(): Promise<Admin[]> {
  const result = await query(
    'SELECT id, email, name, role, created_at, updated_at FROM admins ORDER BY created_at DESC'
  )
  
  return result.rows
}

export async function getAllUsers(): Promise<User[]> {
  const result = await query(
    'SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC'
  )
  
  return result.rows
}

export async function verifyUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email)
  
  if (!user) {
    return null
  }
  
  const isValid = await verifyPassword(password, user.password_hash)
  
  if (!isValid) {
    return null
  }
  
  // Return user without password
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword
}

export async function updateAdminRole(id: number, role: 'superadmin' | 'admin' | 'user'): Promise<Admin | null> {
  const result = await query(
    'UPDATE admins SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, role, created_at, updated_at',
    [role, id]
  )
  
  return result.rows[0] || null
}

export async function deleteUser(id: number): Promise<boolean> {
  const result = await query('DELETE FROM users WHERE id = $1', [id])
  return result.rowCount !== null && result.rowCount > 0
}

export async function deleteAdmin(id: number): Promise<boolean> {
  const result = await query('DELETE FROM admins WHERE id = $1', [id])
  return result.rowCount !== null && result.rowCount > 0
}

