-- Search Cache Infrastructure for Performance Optimization
-- Migration: 20251217100739_add_search_cache_infrastructure
--
-- PURPOSE:
-- Create caching infrastructure to reduce API calls and improve response times
-- for Comps Navigator and Mandate Matcher features.
--
-- TABLES CREATED:
-- 1. search_query_cache - Semantic cache for search queries (embedding similarity)
-- 2. llm_reranking_cache - Cache for LLM re-ranking results (exact match)
--
-- EXPECTED IMPACT:
-- - 60-90% latency reduction for similar/repeated queries
-- - 40-70% reduction in OpenAI API costs
-- - Cache hit rates: Mandate 40-60%, Comps 20-40%
--
-- RESEARCH SOURCES:
-- - https://redis.io/blog/whats-the-best-embedding-model-for-semantic-caching/
-- - https://arxiv.org/abs/2411.05276 (GPT Semantic Cache paper)

-- =====================================================================
-- STEP 1: Create semantic query cache table
-- =====================================================================

CREATE TABLE IF NOT EXISTS search_query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Query identification
  feature_type TEXT NOT NULL CHECK (feature_type IN ('comps', 'mandate', 'chat')),
  query_hash TEXT NOT NULL,  -- MD5 hash of normalized query for exact match fallback
  query_text TEXT NOT NULL,  -- Original query text for debugging
  query_embedding VECTOR(1536),  -- For semantic similarity matching

  -- Cached response
  response_data JSONB NOT NULL,  -- Full search results
  result_count INT DEFAULT 0,
  avg_match_score FLOAT,

  -- Cache metadata
  hit_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_hit_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  -- For comps-specific caching
  comp_titles TEXT[],  -- Sorted comp titles for exact matching
  refinement_text TEXT,

  -- Unique constraint for exact match lookups
  CONSTRAINT unique_query_hash_feature UNIQUE (query_hash, feature_type)
);

-- Index for semantic similarity search (HNSW)
CREATE INDEX IF NOT EXISTS idx_search_query_cache_embedding_hnsw
ON search_query_cache USING hnsw (query_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index for exact hash lookup
CREATE INDEX IF NOT EXISTS idx_search_query_cache_hash
ON search_query_cache (query_hash, feature_type);

-- Index for feature type filtering
CREATE INDEX IF NOT EXISTS idx_search_query_cache_feature
ON search_query_cache (feature_type);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_search_query_cache_expires
ON search_query_cache (expires_at);

-- =====================================================================
-- STEP 2: Create LLM re-ranking cache table (for Comps Navigator)
-- =====================================================================

CREATE TABLE IF NOT EXISTS llm_reranking_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cache key components
  cache_key TEXT NOT NULL UNIQUE,  -- Hash of (sorted comp_titles + refinement + candidate_ids)
  comp_titles TEXT[] NOT NULL,
  refinement_text TEXT,
  candidate_ids UUID[] NOT NULL,  -- IDs of titles being re-ranked

  -- Cached LLM response
  reranking_results JSONB NOT NULL,  -- Full dimension scores and explanations
  model_used TEXT DEFAULT 'gpt-4o-mini',

  -- Cache metadata
  hit_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_hit_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  -- Cost tracking
  tokens_used INT,
  estimated_cost FLOAT
);

-- Index for cache key lookup
CREATE INDEX IF NOT EXISTS idx_llm_reranking_cache_key
ON llm_reranking_cache (cache_key);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_llm_reranking_cache_expires
ON llm_reranking_cache (expires_at);

-- =====================================================================
-- STEP 3: Create semantic cache lookup function
-- =====================================================================

CREATE OR REPLACE FUNCTION find_similar_cached_query(
  p_query_embedding VECTOR(1536),
  p_feature_type TEXT,
  p_similarity_threshold FLOAT DEFAULT 0.92,
  p_limit INT DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  query_text TEXT,
  response_data JSONB,
  similarity FLOAT,
  hit_count INT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.query_text,
    c.response_data,
    (1 - (c.query_embedding <=> p_query_embedding)) AS similarity,
    c.hit_count,
    c.created_at
  FROM search_query_cache c
  WHERE c.feature_type = p_feature_type
    AND c.query_embedding IS NOT NULL
    AND c.expires_at > NOW()
    AND (1 - (c.query_embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY c.query_embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION find_similar_cached_query IS
'Find cached search results for semantically similar queries. Uses HNSW index for fast similarity search. Threshold of 0.92 provides good balance between hit rate and accuracy.';

-- =====================================================================
-- STEP 4: Create cache update function (increment hit count)
-- =====================================================================

CREATE OR REPLACE FUNCTION update_cache_hit(
  p_cache_id UUID,
  p_cache_type TEXT DEFAULT 'query'  -- 'query' or 'reranking'
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_cache_type = 'query' THEN
    UPDATE search_query_cache
    SET hit_count = hit_count + 1,
        last_hit_at = NOW()
    WHERE id = p_cache_id;
  ELSIF p_cache_type = 'reranking' THEN
    UPDATE llm_reranking_cache
    SET hit_count = hit_count + 1,
        last_hit_at = NOW()
    WHERE id = p_cache_id;
  END IF;
END;
$$;

-- =====================================================================
-- STEP 5: Create cache cleanup function
-- =====================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS TABLE (
  query_cache_deleted INT,
  reranking_cache_deleted INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_query_deleted INT;
  v_reranking_deleted INT;
BEGIN
  -- Delete expired query cache entries
  WITH deleted AS (
    DELETE FROM search_query_cache
    WHERE expires_at < NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_query_deleted FROM deleted;

  -- Delete expired reranking cache entries
  WITH deleted AS (
    DELETE FROM llm_reranking_cache
    WHERE expires_at < NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_reranking_deleted FROM deleted;

  RETURN QUERY SELECT v_query_deleted, v_reranking_deleted;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_cache IS
'Remove expired cache entries. Should be run periodically via cron job or scheduled function.';

-- =====================================================================
-- STEP 6: Create cache statistics view
-- =====================================================================

CREATE OR REPLACE VIEW cache_statistics AS
SELECT
  'query_cache' AS cache_type,
  feature_type,
  COUNT(*) AS total_entries,
  SUM(hit_count) AS total_hits,
  AVG(hit_count) AS avg_hits_per_entry,
  COUNT(*) FILTER (WHERE hit_count > 0) AS entries_with_hits,
  ROUND(100.0 * COUNT(*) FILTER (WHERE hit_count > 0) / NULLIF(COUNT(*), 0), 2) AS hit_rate_pct,
  MIN(created_at) AS oldest_entry,
  MAX(last_hit_at) AS most_recent_hit
FROM search_query_cache
WHERE expires_at > NOW()
GROUP BY feature_type

UNION ALL

SELECT
  'reranking_cache' AS cache_type,
  'comps' AS feature_type,
  COUNT(*) AS total_entries,
  SUM(hit_count) AS total_hits,
  AVG(hit_count) AS avg_hits_per_entry,
  COUNT(*) FILTER (WHERE hit_count > 0) AS entries_with_hits,
  ROUND(100.0 * COUNT(*) FILTER (WHERE hit_count > 0) / NULLIF(COUNT(*), 0), 2) AS hit_rate_pct,
  MIN(created_at) AS oldest_entry,
  MAX(last_hit_at) AS most_recent_hit
FROM llm_reranking_cache
WHERE expires_at > NOW();

-- =====================================================================
-- STEP 7: Grant permissions
-- =====================================================================

-- Query cache
GRANT SELECT, INSERT, UPDATE, DELETE ON search_query_cache TO service_role;
GRANT SELECT ON search_query_cache TO authenticated;

-- Reranking cache
GRANT SELECT, INSERT, UPDATE, DELETE ON llm_reranking_cache TO service_role;
GRANT SELECT ON llm_reranking_cache TO authenticated;

-- Functions
GRANT EXECUTE ON FUNCTION find_similar_cached_query(VECTOR(1536), TEXT, FLOAT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION find_similar_cached_query(VECTOR(1536), TEXT, FLOAT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_cache_hit(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache() TO service_role;

-- Statistics view
GRANT SELECT ON cache_statistics TO service_role;
GRANT SELECT ON cache_statistics TO authenticated;

-- =====================================================================
-- STEP 8: Add helpful comments
-- =====================================================================

COMMENT ON TABLE search_query_cache IS
'Semantic cache for search queries. Uses embedding similarity to find cached results for similar queries. Expected hit rate: 40-60% for mandates, 20-40% for comps.';

COMMENT ON TABLE llm_reranking_cache IS
'Cache for LLM re-ranking results in Comps Navigator. Uses exact match on cache key (hash of comp titles + refinement + candidates). Saves 3-8 seconds and ~$0.01 per hit.';

COMMENT ON VIEW cache_statistics IS
'Real-time statistics on cache performance. Use to monitor hit rates and optimize cache parameters.';
