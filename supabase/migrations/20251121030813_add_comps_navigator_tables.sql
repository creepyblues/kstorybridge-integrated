-- Migration: Add Comps Navigator Tables
-- Description: Creates comp_searches and comp_title_cache tables for the Comps Navigator feature
-- Status: IN_PROGRESS
-- Created: 2025-11-20
-- Feature: Comps Navigator - allows buyers to find Korean titles similar to combinations of Hollywood/global comps

-- =====================================================
-- Table: comp_searches
-- Purpose: Store search history and bookmarked searches for users
-- =====================================================

CREATE TABLE IF NOT EXISTS comp_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  comp_titles text[] NOT NULL,
  refinement_text text,
  search_name text, -- For bookmarked searches
  search_results jsonb, -- Cached results
  created_at timestamptz DEFAULT now(),
  is_bookmarked boolean DEFAULT false,
  result_count int,
  avg_match_score float,

  -- Constraints
  CONSTRAINT comp_titles_length CHECK (array_length(comp_titles, 1) BETWEEN 1 AND 3),
  CONSTRAINT refinement_text_length CHECK (
    refinement_text IS NULL OR
    length(refinement_text) <= 500
  )
);

-- Indexes for performance
CREATE INDEX idx_comp_searches_user ON comp_searches(user_email);
CREATE INDEX idx_comp_searches_bookmarked ON comp_searches(user_email, is_bookmarked);
CREATE INDEX idx_comp_searches_created ON comp_searches(created_at DESC);

-- =====================================================
-- Table: comp_title_cache
-- Purpose: Cache embeddings for comp titles to reduce API calls and improve performance
-- =====================================================

CREATE TABLE IF NOT EXISTS comp_title_cache (
  comp_title text PRIMARY KEY,
  embedding vector(1536) NOT NULL,
  source text DEFAULT 'user_input', -- 'user_input' | 'database' | 'external_api'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for cleanup/monitoring
CREATE INDEX idx_comp_cache_updated ON comp_title_cache(updated_at DESC);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE comp_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE comp_title_cache ENABLE ROW LEVEL SECURITY;

-- comp_searches policies

-- Policy: Users can view their own searches
CREATE POLICY "Users can view own searches"
  ON comp_searches
  FOR SELECT
  USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Users can insert their own searches
CREATE POLICY "Users can insert own searches"
  ON comp_searches
  FOR INSERT
  WITH CHECK (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Users can update their own searches (for bookmarking)
CREATE POLICY "Users can update own searches"
  ON comp_searches
  FOR UPDATE
  USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Users can delete their own searches
CREATE POLICY "Users can delete own searches"
  ON comp_searches
  FOR DELETE
  USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- comp_title_cache policies

-- Policy: All authenticated users can read cached embeddings
CREATE POLICY "Authenticated users can read cache"
  ON comp_title_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Service role can manage cache (for edge function)
CREATE POLICY "Service role can manage cache"
  ON comp_title_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Helper Function: Get or Create Comp Embedding
-- Purpose: Utility function for edge function to check cache before generating new embeddings
-- =====================================================

CREATE OR REPLACE FUNCTION get_cached_comp_embedding(p_comp_title text)
RETURNS vector(1536)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cached_embedding vector(1536);
BEGIN
  SELECT embedding INTO cached_embedding
  FROM comp_title_cache
  WHERE comp_title = lower(trim(p_comp_title));

  RETURN cached_embedding;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION get_cached_comp_embedding(text) TO authenticated, service_role;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE comp_searches IS 'Stores user search history and bookmarked comp combinations for the Comps Navigator feature';
COMMENT ON TABLE comp_title_cache IS 'Caches OpenAI embeddings for comp titles to reduce API calls and improve performance';

COMMENT ON COLUMN comp_searches.comp_titles IS 'Array of 1-3 comparable titles (e.g., ["Squid Game", "Parasite", "Black Mirror"])';
COMMENT ON COLUMN comp_searches.refinement_text IS 'Optional text refinement (e.g., "more comedic tone, female lead")';
COMMENT ON COLUMN comp_searches.search_name IS 'User-defined name for bookmarked searches';
COMMENT ON COLUMN comp_searches.search_results IS 'Cached search results to allow quick restoration of saved searches';
COMMENT ON COLUMN comp_searches.is_bookmarked IS 'Whether this search has been bookmarked by the user';

COMMENT ON COLUMN comp_title_cache.embedding IS 'OpenAI text-embedding-ada-002 vector (1536 dimensions)';
COMMENT ON COLUMN comp_title_cache.source IS 'Source of the comp title: user_input, database, or external_api';
