-- Step-by-Step Genre Array Migration
-- Run these queries one at a time in Supabase SQL Editor

-- STEP 1: Preview current data (run this first)
SELECT 
    id,
    title_name_en,
    genre,
    genre_kr,
    string_to_array(genre, ',') as preview_genre_array,
    string_to_array(genre_kr, ',') as preview_genre_kr_array
FROM titles 
WHERE genre IS NOT NULL OR genre_kr IS NOT NULL
LIMIT 10;

-- STEP 2: Add new columns (run after reviewing step 1)
-- ALTER TABLE titles ADD COLUMN genre_new text[];
-- ALTER TABLE titles ADD COLUMN genre_kr_new text[];

-- STEP 3: Convert genre column (run after step 2)
-- UPDATE titles 
-- SET genre_new = string_to_array(genre, ',')
-- WHERE genre IS NOT NULL AND genre != '';

-- STEP 4: Convert genre_kr column (run after step 3)
-- UPDATE titles 
-- SET genre_kr_new = string_to_array(genre_kr, ',')
-- WHERE genre_kr IS NOT NULL AND genre_kr != '';

-- STEP 5: Clean up whitespace (run after step 4)
-- UPDATE titles 
-- SET genre_new = array(
--     SELECT TRIM(unnest(genre_new))
--     WHERE TRIM(unnest(genre_new)) != ''
-- )
-- WHERE genre_new IS NOT NULL;

-- UPDATE titles 
-- SET genre_kr_new = array(
--     SELECT TRIM(unnest(genre_kr_new))
--     WHERE TRIM(unnest(genre_kr_new)) != ''
-- )
-- WHERE genre_kr_new IS NOT NULL;

-- STEP 6: Verify the conversion (run after step 5)
-- SELECT 
--     id,
--     title_name_en,
--     genre as old_genre,
--     genre_new,
--     genre_kr as old_genre_kr,
--     genre_kr_new
-- FROM titles 
-- WHERE genre_new IS NOT NULL OR genre_kr_new IS NOT NULL
-- LIMIT 10;

-- STEP 7: Drop old columns and rename (run after verifying step 6)
-- ALTER TABLE titles DROP COLUMN genre;
-- ALTER TABLE titles DROP COLUMN genre_kr;
-- ALTER TABLE titles RENAME COLUMN genre_new TO genre;
-- ALTER TABLE titles RENAME COLUMN genre_kr_new TO genre_kr;

-- STEP 8: Final verification
-- SELECT 
--     COUNT(*) as total_titles,
--     COUNT(genre) as with_genre_array,
--     COUNT(genre_kr) as with_genre_kr_array
-- FROM titles;