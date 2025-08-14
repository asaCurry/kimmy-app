-- Migration: Rename family_id to household_id across all tables
-- This migration updates the remote database to match the local schema

-- Rename columns in users table
ALTER TABLE `users` RENAME COLUMN `family_id` TO `household_id`;

-- Rename columns in record_types table  
ALTER TABLE `record_types` RENAME COLUMN `family_id` TO `household_id`;

-- Rename columns in records table
ALTER TABLE `records` RENAME COLUMN `family_id` TO `household_id`;

-- Rename columns in quick_notes table
ALTER TABLE `quick_notes` RENAME COLUMN `family_id` TO `household_id`;

-- Note: SQLite doesn't support dropping/adding foreign keys easily
-- The foreign key relationships will need to be recreated manually if needed
-- For now, the column rename should maintain the existing relationships
