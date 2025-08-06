-- Standalone SQL Script: Convert genre and genre_kr to arrays
-- Copy and paste this entire script into the Supabase SQL Editor

-- STEP 1: Preview the data that will be converted (run this first to see current data)
SELECT 
    id,
    title_name_en,
    genre as current_genre,
    genre_kr as current_genre_kr,
    -- Preview what the arrays will look like
    CASE 
        WHEN genre IS NULL OR TRIM(genre) = '' THEN NULL
        ELSE ARRAY(
            SELECT TRIM(unnest(string_to_array(genre, ',')))
            WHERE TRIM(unnest(string_to_array(genre, ','))) != ''
        )
    END as preview_genre_array,
    CASE 
        WHEN genre_kr IS NULL OR TRIM(genre_kr) = '' THEN NULL
        ELSE ARRAY(
            SELECT TRIM(unnest(string_to_array(genre_kr, ',')))
            WHERE TRIM(unnest(string_to_array(genre_kr, ','))) != ''
        )
    END as preview_genre_kr_array
FROM titles 
WHERE genre IS NOT NULL OR genre_kr IS NOT NULL
LIMIT 10;

-- STEP 2: Run the actual migration (comment out the preview above first)
/*
BEGIN;

-- Add new array columns
ALTER TABLE titles ADD COLUMN genre_new text[];
ALTER TABLE titles ADD COLUMN genre_kr_new text[];

-- Migrate data to arrays, handling comma-separated values
UPDATE titles 
SET genre_new = CASE 
    WHEN genre IS NULL OR TRIM(genre) = '' THEN NULL
    ELSE ARRAY(
        SELECT TRIM(unnest(string_to_array(genre, ',')))
        WHERE TRIM(unnest(string_to_array(genre, ','))) != ''
    )
END;

UPDATE titles 
SET genre_kr_new = CASE 
    WHEN genre_kr IS NULL OR TRIM(genre_kr) = '' THEN NULL
    ELSE ARRAY(
        SELECT TRIM(unnest(string_to_array(genre_kr, ',')))
        WHERE TRIM(unnest(string_to_array(genre_kr, ','))) != ''
    )
END;

-- Drop old columns and rename new ones
ALTER TABLE titles DROP COLUMN genre;
ALTER TABLE titles DROP COLUMN genre_kr;
ALTER TABLE titles RENAME COLUMN genre_new TO genre;
ALTER TABLE titles RENAME COLUMN genre_kr_new TO genre_kr;

-- Add helpful comments
COMMENT ON COLUMN titles.genre IS 'Genre tags as text array (converted from comma-separated)';
COMMENT ON COLUMN titles.genre_kr IS 'Korean genre tags as text array (converted from comma-separated)';

COMMIT;
*/

-- STEP 3: Verify the migration (run this after the migration)
/*
SELECT 
    COUNT(*) as total_titles,
    COUNT(genre) as titles_with_genre,
    COUNT(genre_kr) as titles_with_genre_kr,
    AVG(array_length(genre, 1)) as avg_genre_count,
    AVG(array_length(genre_kr, 1)) as avg_genre_kr_count
FROM titles;

-- Sample of converted data
SELECT id, title_name_en, genre, genre_kr 
FROM titles 
WHERE genre IS NOT NULL 
LIMIT 5;
*/