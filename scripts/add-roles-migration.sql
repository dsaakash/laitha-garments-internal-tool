-- Add role column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'user'));

-- Update existing admins to be superadmin (first admin)
UPDATE admins SET role = 'superadmin' WHERE id = (SELECT MIN(id) FROM admins);

-- Create users table for regular users (who can only view catalogues)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for users email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
