-- Verify Database State After Regeneration
-- Run this directly in Supabase Dashboard SQL Editor

-- 1. Check "I Became a Doting Father" specifically
SELECT
  title_id,
  title_name_en,
  array_length(combined_embedding, 1) as embedding_dimension,
  embedding_model,
  embedding_updated_at,
  updated_at
FROM titles
WHERE title_name_en = 'I Became a Doting Father';

-- 2. Get distribution of embedding dimensions across all titles
SELECT
  array_length(combined_embedding, 1) as dimension,
  COUNT(*) as count,
  CASE
    WHEN array_length(combined_embedding, 1) = 1536 THEN '✅ Valid'
    WHEN array_length(combined_embedding, 1) IS NULL THEN '⚪ NULL'
    ELSE '❌ Invalid'
  END as status
FROM titles
GROUP BY array_length(combined_embedding, 1)
ORDER BY dimension DESC NULLS LAST;

-- 3. Check recent updates (last 24 hours)
SELECT
  title_name_en,
  array_length(combined_embedding, 1) as dimension,
  embedding_updated_at,
  updated_at
FROM titles
WHERE embedding_updated_at > NOW() - INTERVAL '24 hours'
ORDER BY embedding_updated_at DESC
LIMIT 20;

-- 4. Count NULL vs non-NULL embeddings
SELECT
  COUNT(*) FILTER (WHERE combined_embedding IS NULL) as null_embeddings,
  COUNT(*) FILTER (WHERE combined_embedding IS NOT NULL) as non_null_embeddings,
  COUNT(*) as total_titles
FROM titles;
