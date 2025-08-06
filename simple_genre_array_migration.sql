-- Simple Genre Array Migration - Alternative approach
-- This uses a more straightforward method to avoid function issues

BEGIN;

-- Step 1: Add new array columns
ALTER TABLE titles ADD COLUMN genre_new text[];
ALTER TABLE titles ADD COLUMN genre_kr_new text[];

-- Step 2: Simple array conversion with basic string splitting
-- This approach converts comma-separated strings to arrays and removes empty elements

UPDATE titles 
SET genre_new = CASE 
    WHEN genre IS NULL OR genre = '' THEN NULL
    ELSE array_remove(string_to_array(replace(genre, ' ', ''), ','), '')
END;

UPDATE titles 
SET genre_kr_new = CASE 
    WHEN genre_kr IS NULL OR genre_kr = '' THEN NULL
    ELSE array_remove(string_to_array(replace(genre_kr, ' ', ''), ','), '')
END;

-- Optional: Clean up any remaining empty strings or whitespace
UPDATE titles 
SET genre_new = (
    SELECT array_agg(TRIM(elem)) 
    FROM unnest(genre_new) AS elem 
    WHERE TRIM(elem) != ''
) 
WHERE genre_new IS NOT NULL;

UPDATE titles 
SET genre_kr_new = (
    SELECT array_agg(TRIM(elem)) 
    FROM unnest(genre_kr_new) AS elem 
    WHERE TRIM(elem) != ''
) 
WHERE genre_kr_new IS NOT NULL;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE titles DROP COLUMN genre;
ALTER TABLE titles DROP COLUMN genre_kr;
ALTER TABLE titles RENAME COLUMN genre_new TO genre;
ALTER TABLE titles RENAME COLUMN genre_kr_new TO genre_kr;

-- Step 4: Add comments
COMMENT ON COLUMN titles.genre IS 'Genre tags as text array (converted from comma-separated)';
COMMENT ON COLUMN titles.genre_kr IS 'Korean genre tags as text array (converted from comma-separated)';

COMMIT;

-- Verification
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_titles,
    COUNT(genre) as titles_with_genre,
    COUNT(genre_kr) as titles_with_genre_kr
FROM titles;