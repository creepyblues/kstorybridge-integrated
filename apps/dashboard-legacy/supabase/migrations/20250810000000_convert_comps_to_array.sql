-- Migration: Convert comps field from string to text array
-- Date: 2025-08-10

BEGIN;

-- First, let's see what data we currently have
-- This will help us understand how to convert string data to array format

-- Add a temporary column for the new array data
ALTER TABLE public.titles 
ADD COLUMN comps_array text[] DEFAULT NULL;

-- Convert existing string data to array format
-- This handles comma-separated values and single values
UPDATE public.titles 
SET comps_array = CASE 
  WHEN comps IS NULL THEN NULL
  WHEN comps = '' THEN NULL
  WHEN comps LIKE '%,%' THEN string_to_array(trim(comps), ',')
  ELSE ARRAY[trim(comps)]
END
WHERE comps IS NOT NULL;

-- Clean up any empty strings or whitespace in the arrays
UPDATE public.titles 
SET comps_array = array_remove(
  ARRAY(
    SELECT trim(unnest_val) 
    FROM unnest(comps_array) AS unnest_val 
    WHERE trim(unnest_val) != ''
  ), 
  NULL
)
WHERE comps_array IS NOT NULL;

-- Remove the old comps column
ALTER TABLE public.titles DROP COLUMN comps;

-- Rename the new column to comps
ALTER TABLE public.titles RENAME COLUMN comps_array TO comps;

-- Add a comment to document the field
COMMENT ON COLUMN public.titles.comps IS 'Array of comparable titles/works (formerly a comma-separated string)';

-- Create an index for better query performance on the array field
CREATE INDEX idx_titles_comps ON public.titles USING GIN (comps);

COMMIT;