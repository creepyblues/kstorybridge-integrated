-- Diagnostic SQL for Embedding Issues
-- Run this in Supabase SQL Editor to check embedding storage

-- 1. Check embedding column types
SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'titles'
  AND column_name LIKE '%embedding%'
ORDER BY column_name;

-- 2. Check a specific title that failed
-- Replace with actual title_id from your error
SELECT
  title_id,
  title_name_en,
  title_name_kr,
  combined_embedding IS NOT NULL as has_combined_embedding,
  title_embedding IS NOT NULL as has_title_embedding,
  synopsis_embedding IS NOT NULL as has_synopsis_embedding,
  content_embedding IS NOT NULL as has_content_embedding,
  embedding_model,
  embedding_updated_at,
  pg_typeof(combined_embedding) as combined_type,
  CASE
    WHEN combined_embedding IS NOT NULL
    THEN array_length(combined_embedding::text::float[], 1)
    ELSE NULL
  END as embedding_dimensions
FROM titles
WHERE title_id = '5a09f56d-2f9b-47c2-9725-37b02227ea44'  -- Replace with failed title ID
LIMIT 1;

-- 3. Check recent embedding updates
SELECT
  title_id,
  title_name_en,
  combined_embedding IS NOT NULL as has_embedding,
  embedding_model,
  embedding_updated_at,
  updated_at
FROM titles
WHERE embedding_updated_at IS NOT NULL
ORDER BY embedding_updated_at DESC
LIMIT 10;

-- 4. Count titles with/without embeddings
SELECT
  COUNT(*) as total_titles,
  COUNT(combined_embedding) as titles_with_embeddings,
  COUNT(*) - COUNT(combined_embedding) as titles_without_embeddings,
  ROUND(100.0 * COUNT(combined_embedding) / COUNT(*), 2) as percent_with_embeddings
FROM titles;

-- 5. Check if vector extension is enabled
SELECT
  extname,
  extversion
FROM pg_extension
WHERE extname = 'vector';

-- 6. Test vector type casting (should not error)
-- This tests if we can create and cast vector types
DO $$
DECLARE
  test_vector vector(1536);
  test_array float[];
BEGIN
  -- Create test array
  test_array := array_fill(0.1::float, ARRAY[1536]);

  -- Try to cast to vector
  test_vector := test_array::vector(1536);

  RAISE NOTICE 'Vector type test: SUCCESS';
  RAISE NOTICE 'Vector dimensions: %', array_length(test_vector::float[], 1);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Vector type test: FAILED - %', SQLERRM;
END $$;
