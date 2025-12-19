-- Migration: Add synopsis_kr and description columns to titles table
-- Purpose: Rename description_kr to synopsis_kr (semantically correct) and add description for admin use
-- Status: SAFE - Additive only, no column drops
-- Data Impact: Copies existing description_kr data to new synopsis_kr column
-- Rollback: Safe - description_kr column is preserved for backward compatibility

-- Step 1: Add new columns
ALTER TABLE titles ADD COLUMN IF NOT EXISTS synopsis_kr text;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS description text;

-- Step 2: Copy existing data from description_kr to synopsis_kr
UPDATE titles SET synopsis_kr = description_kr WHERE description_kr IS NOT NULL AND synopsis_kr IS NULL;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN titles.synopsis_kr IS 'Korean synopsis (migrated from description_kr)';
COMMENT ON COLUMN titles.description IS 'Full description for admin use (English)';

-- Note: DO NOT drop description_kr yet - keep for backward compatibility
-- After 2-4 weeks of successful operation, create a separate migration to drop it
