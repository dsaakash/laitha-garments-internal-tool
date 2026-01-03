-- Migration script to add stock tracking to inventory
-- Run this after init-db.sql

-- Add stock tracking fields to inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS quantity_in INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS quantity_out INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0;

-- Update existing records to have current_stock = 0 (will be updated when stock is tracked)
UPDATE inventory SET current_stock = 0 WHERE current_stock IS NULL;

