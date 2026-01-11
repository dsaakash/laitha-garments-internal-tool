-- Migration script for customer enquiries
-- Run this to add customer enquiry functionality

-- Create customer_enquiries table
CREATE TABLE IF NOT EXISTS customer_enquiries (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  product_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(255),
  fabric_type VARCHAR(255),
  enquiry_method VARCHAR(20) DEFAULT 'form' CHECK (enquiry_method IN ('form', 'whatsapp')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'resolved', 'closed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_enquiries_product_id ON customer_enquiries(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_enquiries_status ON customer_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_customer_enquiries_created_at ON customer_enquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_enquiries_phone ON customer_enquiries(customer_phone);
