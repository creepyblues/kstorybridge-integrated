-- Rollback: Convert genre and genre_kr from text array back to text
-- WARNING: This will lose array structure and convert back to comma-separated text

BEGIN;

-- Step 1: Add temporary text columns
ALTER TABLE titles ADD COLUMN genre_text text;
ALTER TABLE titles ADD COLUMN genre_kr_text text;

-- Step 2: Convert arrays back to comma-separated text
UPDATE titles 
SET genre_text = CASE 
    WHEN genre IS NULL OR array_length(genre, 1) IS NULL THEN NULL
    ELSE array_to_string(genre, ', ')
END;

UPDATE titles 
SET genre_kr_text = CASE 
    WHEN genre_kr IS NULL OR array_length(genre_kr, 1) IS NULL THEN NULL
    ELSE array_to_string(genre_kr, ', ')
END;

-- Step 3: Drop array columns
ALTER TABLE titles DROP COLUMN genre;
ALTER TABLE titles DROP COLUMN genre_kr;

-- Step 4: Rename text columns back to original names
ALTER TABLE titles RENAME COLUMN genre_text TO genre;
ALTER TABLE titles RENAME COLUMN genre_kr_text TO genre_kr;

-- Step 5: Update comments
COMMENT ON COLUMN titles.genre IS 'Genre tags as comma-separated text (rolled back from array)';
COMMENT ON COLUMN titles.genre_kr IS 'Korean genre tags as comma-separated text (rolled back from array)';

COMMIT;