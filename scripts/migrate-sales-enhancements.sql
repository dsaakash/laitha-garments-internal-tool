-- Migration script to add discount and GST fields to sales
-- Run this after init-db.sql

-- Add discount fields to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20); -- 'percentage' or 'rupees'
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Add GST fields to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS gst_type VARCHAR(20); -- 'percentage' or 'rupees'
ALTER TABLE sales ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0;

-- Add subtotal and final_total to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS final_total DECIMAL(10, 2);

-- Update existing sales to have subtotal = total_amount and final_total = total_amount (for backward compatibility)
UPDATE sales SET subtotal = total_amount WHERE subtotal IS NULL;
UPDATE sales SET final_total = total_amount WHERE final_total IS NULL;

-- Add per meter pricing fields to sale_items
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS use_per_meter BOOLEAN DEFAULT FALSE;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS meters DECIMAL(10, 2);
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS price_per_meter DECIMAL(10, 2);

