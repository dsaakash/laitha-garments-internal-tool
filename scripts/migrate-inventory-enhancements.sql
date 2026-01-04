-- Migration script to add multiple images and price per meter to inventory
-- Run this after init-db.sql

-- Add pricing unit and price columns to inventory
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS pricing_unit VARCHAR(20); -- 'piece' or 'meter'
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS price_per_piece DECIMAL(10, 2);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS price_per_meter DECIMAL(10, 2);

-- Change image_url to product_images (JSONB array for multiple images)
-- First, create a new column
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS product_images JSONB DEFAULT '[]'::JSONB;

-- Migrate existing image_url to product_images array
UPDATE inventory 
SET product_images = CASE 
  WHEN image_url IS NOT NULL AND image_url != '' THEN jsonb_build_array(image_url)
  ELSE '[]'::JSONB
END
WHERE product_images = '[]'::JSONB OR product_images IS NULL;

-- Keep image_url for backward compatibility, but product_images will be the primary field

