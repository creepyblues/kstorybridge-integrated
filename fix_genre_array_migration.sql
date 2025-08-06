-- Fixed SQL Script: Convert genre and genre_kr to arrays
-- This fixes the set-returning function error

BEGIN;

-- Step 1: Add new array columns
ALTER TABLE titles ADD COLUMN genre_array text[];
ALTER TABLE titles ADD COLUMN genre_kr_array text[];

-- Step 2: Migrate existing data using a different approach
-- Use string_to_array directly and filter empty strings afterwards

UPDATE titles 
SET genre_array = CASE 
    WHEN genre IS NULL OR TRIM(genre) = '' THEN NULL
    ELSE (
        SELECT ARRAY(
            SELECT TRIM(elem) 
            FROM unnest(string_to_array(genre, ',')) AS elem 
            WHERE TRIM(elem) != '' AND TRIM(elem) IS NOT NULL
        )
    )
END;

UPDATE titles 
SET genre_kr_array = CASE 
    WHEN genre_kr IS NULL OR TRIM(genre_kr) = '' THEN NULL
    ELSE (
        SELECT ARRAY(
            SELECT TRIM(elem) 
            FROM unnest(string_to_array(genre_kr, ',')) AS elem 
            WHERE TRIM(elem) != '' AND TRIM(elem) IS NOT NULL
        )
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

-- Verification queries
SELECT 'Migration completed successfully' as status;

-- Show sample results
SELECT 
    id,
    title_name_en,
    genre,
    genre_kr,
    array_length(genre, 1) as genre_count,
    array_length(genre_kr, 1) as genre_kr_count
FROM titles 
WHERE genre IS NOT NULL OR genre_kr IS NOT NULL
LIMIT 5;