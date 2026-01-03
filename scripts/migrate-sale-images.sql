-- Migration script to add sale image support
-- Run this after init-db.sql

-- Add sale_image column to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_image TEXT;

