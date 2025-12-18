-- Optimize HNSW Vector Index for Faster Semantic Search
-- Migration: 20251217072842_optimize_hnsw_vector_index
--
-- PURPOSE:
-- Create an optimized HNSW (Hierarchical Navigable Small World) index on the
-- combined_embedding column for 20-50% faster vector search performance.
--
-- PERFORMANCE IMPACT:
-- - HNSW provides better query performance than IVFFlat for most workloads
-- - Expected 20-50% reduction in vector search latency
-- - m=24 provides good balance between index size and search quality
-- - ef_construction=128 ensures good index quality during build
--
-- NOTE: HNSW index build requires sufficient memory. If this fails due to
-- memory constraints, try running during off-peak hours or contact Supabase
-- support to temporarily increase maintenance_work_mem.
--
-- RESEARCH SOURCES:
-- - https://supabase.com/docs/guides/ai/vector-indexes/hnsw-indexes
-- - https://supabase.com/blog/increase-performance-pgvector-hnsw
--
-- ROLLBACK: DROP INDEX idx_titles_combined_embedding_hnsw;

-- =====================================================================
-- STEP 1: Check if pgvector extension supports HNSW (version 0.5.0+)
-- =====================================================================

DO $$
DECLARE
  pgvector_version text;
BEGIN
  -- Get pgvector version
  SELECT extversion INTO pgvector_version
  FROM pg_extension
  WHERE extname = 'vector';

  IF pgvector_version IS NULL THEN
    RAISE EXCEPTION 'pgvector extension not installed';
  END IF;

  RAISE NOTICE 'pgvector version: %', pgvector_version;

  -- Check if version supports HNSW (0.5.0+)
  IF pgvector_version < '0.5.0' THEN
    RAISE EXCEPTION 'pgvector version % does not support HNSW indexes. Requires 0.5.0+', pgvector_version;
  END IF;
END $$;

-- =====================================================================
-- STEP 2: Drop existing IVFFlat index if it exists
-- =====================================================================

DROP INDEX IF EXISTS idx_titles_combined_embedding_ivfflat;
DROP INDEX IF EXISTS idx_titles_combined_embedding;

-- =====================================================================
-- STEP 3: Create optimized HNSW index
-- =====================================================================

-- HNSW Parameters:
-- m = 24: Number of bi-directional links per node (higher = better quality, larger index)
--         Default is 16, but 24 provides better recall for our dataset size
-- ef_construction = 128: Size of dynamic candidate list during construction
--         Higher values lead to better index quality but slower build time
--         128 is a good balance for production workloads

-- Note: Using vector_cosine_ops because our embeddings are normalized
-- and we use cosine similarity for matching

CREATE INDEX IF NOT EXISTS idx_titles_combined_embedding_hnsw
ON titles USING hnsw (combined_embedding vector_cosine_ops)
WITH (m = 24, ef_construction = 128);

-- =====================================================================
-- STEP 4: Create function to set search parameters
-- =====================================================================

-- ef_search controls the size of the dynamic candidate list during search
-- Higher values = better recall, slower search
-- 100 is recommended for production (default is 40)

CREATE OR REPLACE FUNCTION set_vector_search_params()
RETURNS void AS $$
BEGIN
  -- Set search-time parameter for HNSW
  -- This affects all subsequent vector searches in the session
  PERFORM set_config('hnsw.ef_search', '100', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_vector_search_params IS
'Sets optimized HNSW search parameters (ef_search=100) for better recall. Call at session start for optimal vector search performance.';

GRANT EXECUTE ON FUNCTION set_vector_search_params() TO authenticated;
GRANT EXECUTE ON FUNCTION set_vector_search_params() TO service_role;

-- =====================================================================
-- STEP 5: Pre-warm index (helps avoid cold cache penalty)
-- =====================================================================

-- Note: pg_prewarm extension must be enabled
-- If not enabled, this will fail gracefully

DO $$
BEGIN
  -- Try to pre-warm the index into shared buffers
  PERFORM pg_prewarm('idx_titles_combined_embedding_hnsw');
  RAISE NOTICE 'HNSW index pre-warmed successfully';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'pg_prewarm not available - skipping index pre-warm';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not pre-warm index: %', SQLERRM;
END $$;

-- =====================================================================
-- STEP 6: Update RPC function to use optimized search parameters
-- =====================================================================

-- Recreate the vector search function with HNSW optimization hints
DROP FUNCTION IF EXISTS match_titles_by_embedding_optimized(vector(1536), float, int);

CREATE OR REPLACE FUNCTION match_titles_by_embedding_optimized(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 30
)
RETURNS TABLE (
  title_id uuid,
  title_name_en text,
  title_name_kr text,
  synopsis text,
  description text,
  genre text[],
  tone text,
  content_format text,
  title_image text,
  similarity float,
  priority text,
  verified boolean,
  views bigint,
  likes bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set optimized HNSW search parameter for this query
  -- ef_search=100 provides good recall/speed balance
  PERFORM set_config('hnsw.ef_search', '100', true);

  RETURN QUERY
  SELECT
    t.title_id,
    t.title_name_en,
    t.title_name_kr,
    t.synopsis,
    t.description_kr as description,
    t.genre,
    t.tone,
    t.content_format::text,
    t.title_image,
    (1 - (t.combined_embedding <=> query_embedding)) AS similarity,
    t.priority::text,
    COALESCE(t.verified, false) as verified,
    COALESCE(t.views, 0) as views,
    COALESCE(t.likes, 0) as likes
  FROM titles t
  WHERE t.combined_embedding IS NOT NULL
    AND (t.combined_embedding <=> query_embedding) < (1 - match_threshold)
  ORDER BY t.combined_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_titles_by_embedding_optimized IS
'Optimized vector search using HNSW index with ef_search=100. Returns priority fields for business-value ranking.';

GRANT EXECUTE ON FUNCTION match_titles_by_embedding_optimized(vector(1536), float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION match_titles_by_embedding_optimized(vector(1536), float, int) TO service_role;

-- =====================================================================
-- STEP 7: Verify index creation
-- =====================================================================

DO $$
DECLARE
  index_exists boolean;
  index_method text;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_titles_combined_embedding_hnsw'
  ) INTO index_exists;

  IF index_exists THEN
    SELECT am.amname INTO index_method
    FROM pg_indexes i
    JOIN pg_class c ON c.relname = i.indexname
    JOIN pg_am am ON am.oid = c.relam
    WHERE i.indexname = 'idx_titles_combined_embedding_hnsw';

    RAISE NOTICE 'HNSW index created successfully using method: %', index_method;
  ELSE
    RAISE WARNING 'HNSW index was not created - check for errors above';
  END IF;
END $$;
