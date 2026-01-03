-- Migration script to add multiple contact persons to suppliers
-- Run this after init-db.sql

-- Create supplier_contacts table
CREATE TABLE IF NOT EXISTS supplier_contacts (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
  contact_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  whatsapp_number VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier_id ON supplier_contacts(supplier_id);

