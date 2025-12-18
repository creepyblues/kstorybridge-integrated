-- ============================================
-- TITLES METADATA NORMALIZATION MIGRATION
-- ============================================
-- Purpose: Standardize tone, audience, age_rating, content_format values
-- Total Titles: 244
-- Date: 2025-12-17
--
-- Issues Addressed:
-- 1. tone: 43 different variants with inconsistent casing
-- 2. audience: 63 "N/A" placeholders + inconsistent formats
-- 3. age_rating: Korean notation mixed with English + "N/A" placeholders
-- 4. content_format: 115 titles with NULL values
--
-- Expected Changes:
-- - tone: Lowercase all values, fix truncated entries
-- - audience: Remove "N/A" placeholders (→ NULL for later AI assignment)
-- - age_rating: Korean → English notation (전체이용가 → ALL, 15세 → 15+, 19세 → 19+)
-- - content_format: Fill NULL with 'webtoon' (default for this dataset)
-- ============================================

BEGIN;

-- ============================================
-- 1. TONE NORMALIZATION
-- ============================================

-- 1a. Normalize all tone values to lowercase and trim whitespace
UPDATE titles
SET tone = LOWER(TRIM(tone))
WHERE tone IS NOT NULL;

-- 1b. Fix truncated tone values
UPDATE titles SET tone = 'heartwarming' WHERE tone = 'heart-';
UPDATE titles SET tone = 'character-driven' WHERE tone = 'character-';

-- 1c. Convert placeholder "not specified" to NULL for later assignment
UPDATE titles SET tone = NULL WHERE tone = 'not specified';

-- ============================================
-- 2. AUDIENCE NORMALIZATION
-- ============================================

-- 2a. Convert "N/A" placeholders to NULL (63 titles)
UPDATE titles SET audience = NULL WHERE audience = 'N/A';

-- 2b. Normalize existing valid audience values to consistent format
UPDATE titles SET audience = 'ADULTS 18-34' WHERE audience ILIKE '%female%18%34%';
UPDATE titles SET audience = 'ADULTS 18-34' WHERE audience ILIKE '%women%16%34%';
UPDATE titles SET audience = 'ADULTS 16-34' WHERE audience = 'ADULTS 16-34';

-- ============================================
-- 3. AGE_RATING NORMALIZATION
-- ============================================

-- 3a. Convert Korean age ratings to English notation
UPDATE titles SET age_rating = 'ALL' WHERE age_rating = '전체이용가';
UPDATE titles SET age_rating = '15+' WHERE age_rating LIKE '15세%';
UPDATE titles SET age_rating = '19+' WHERE age_rating LIKE '19세%';

-- 3b. Convert "N/A" placeholders to NULL
UPDATE titles SET age_rating = NULL WHERE age_rating = 'N/A';

-- 3c. Handle alternate Korean notation
UPDATE titles SET age_rating = 'ALL' WHERE age_rating = '전체연령가';

-- 3d. Convert "NONE" to NULL
UPDATE titles SET age_rating = NULL WHERE age_rating = 'NONE';

-- ============================================
-- 4. CONTENT_FORMAT FILL
-- ============================================

-- Fill NULL content_format with 'webtoon' (default for this dataset)
-- All 115 titles with NULL are from webtoon CPs (Manwha Family, MANTA/RIDI)
UPDATE titles
SET content_format = 'webtoon'
WHERE content_format IS NULL;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (run manually after migration)
-- ============================================
--
-- Check tone distribution:
-- SELECT tone, COUNT(*) FROM titles GROUP BY tone ORDER BY count DESC;
--
-- Check audience distribution:
-- SELECT audience, COUNT(*) FROM titles GROUP BY audience ORDER BY count DESC;
--
-- Check age_rating distribution:
-- SELECT age_rating, COUNT(*) FROM titles GROUP BY age_rating ORDER BY count DESC;
--
-- Check content_format distribution:
-- SELECT content_format, COUNT(*) FROM titles GROUP BY content_format ORDER BY count DESC;
--
-- ============================================
