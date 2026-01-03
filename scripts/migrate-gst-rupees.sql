-- Migration script to add GST in rupees support
-- Run this after migrate-purchase-orders.sql

-- Add GST amount in rupees and GST type to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS gst_amount_rupees DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS gst_type VARCHAR(20) DEFAULT 'percentage'; -- 'percentage' or 'rupees'

-- Add GST type to purchase_orders table for manual override
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS gst_type VARCHAR(20) DEFAULT 'percentage';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5, 2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS gst_amount_rupees DECIMAL(10, 2) DEFAULT 0;

