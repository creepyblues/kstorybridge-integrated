-- Clear all comp_title_cache entries to fix null embedding issue
-- The edge function will automatically regenerate embeddings on next search

-- Show current cache before deletion
SELECT
  comp_title,
  substring(embedding::text, 1, 50) as embedding_preview,
  created_at,
  source
FROM comp_title_cache
ORDER BY created_at DESC;

-- Delete all cache entries
TRUNCATE TABLE comp_title_cache;

-- Verify deletion
SELECT COUNT(*) as remaining_entries FROM comp_title_cache;

-- NOTE: Embeddings will be automatically regenerated when users perform new searches
-- This will ensure all embeddings are properly formatted without null values
