-- Migration script for enhanced purchase orders
-- Run this after init-db.sql

-- Add GST field to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5, 2) DEFAULT 0;

-- Create purchase_order_items table for multiple products per order
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(255), -- dress_type/category
  sizes TEXT[],
  fabric_type VARCHAR(255),
  quantity INTEGER NOT NULL,
  price_per_piece DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  product_images TEXT[], -- Array of image URLs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new fields to purchase_orders table
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS custom_po_number VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_image TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS grand_total DECIMAL(10, 2);

-- Update existing purchase_orders to have subtotal = total_amount (for backward compatibility)
UPDATE purchase_orders SET subtotal = total_amount WHERE subtotal IS NULL;
UPDATE purchase_orders SET grand_total = total_amount WHERE grand_total IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_category ON purchase_order_items(category);

