-- Migration: Convert genre and genre_kr from text to text array
-- This script will:
-- 1. Add new array columns
-- 2. Migrate existing comma-separated data to arrays
-- 3. Drop old text columns
-- 4. Rename new columns to original names

BEGIN;

-- Step 1: Add new array columns
ALTER TABLE titles ADD COLUMN genre_array text[];
ALTER TABLE titles ADD COLUMN genre_kr_array text[];

-- Step 2: Migrate existing data from text to array
-- Split comma-separated values and trim whitespace
UPDATE titles 
SET genre_array = CASE 
    WHEN genre IS NULL OR TRIM(genre) = '' THEN NULL
    ELSE ARRAY(
        SELECT TRIM(unnest(string_to_array(genre, ',')))
        WHERE TRIM(unnest(string_to_array(genre, ','))) != ''
    )
END;

UPDATE titles 
SET genre_kr_array = CASE 
    WHEN genre_kr IS NULL OR TRIM(genre_kr) = '' THEN NULL
    ELSE ARRAY(
        SELECT TRIM(unnest(string_to_array(genre_kr, ',')))
        WHERE TRIM(unnest(string_to_array(genre_kr, ','))) != ''
    )
END;

-- Step 3: Drop old text columns
ALTER TABLE titles DROP COLUMN genre;
ALTER TABLE titles DROP COLUMN genre_kr;

-- Step 4: Rename new array columns to original names
ALTER TABLE titles RENAME COLUMN genre_array TO genre;
ALTER TABLE titles RENAME COLUMN genre_kr_array TO genre_kr;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN titles.genre IS 'Genre tags stored as text array, migrated from comma-separated text';
COMMENT ON COLUMN titles.genre_kr IS 'Korean genre tags stored as text array, migrated from comma-separated text';

COMMIT;

-- Verification queries (run these separately to check the migration)
-- SELECT id, genre, genre_kr FROM titles WHERE genre IS NOT NULL LIMIT 10;
-- SELECT COUNT(*) as total_titles, 
--        COUNT(genre) as titles_with_genre, 
--        COUNT(genre_kr) as titles_with_genre_kr 
-- FROM titles;