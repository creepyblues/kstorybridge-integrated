-- Add metadata fields to vector search function
-- This migration expands match_titles_by_embedding to return all title metadata
-- CRITICAL: Backward compatible - existing code continues to work

-- Status: IN_PROGRESS
-- Date: 2025-02-00
-- Purpose: Fix AI showing "[Not specified]" for database fields that exist

-- Drop existing function (all possible signatures)
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector, float, int);
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector(1536), float, int);

-- Recreate with expanded return fields (backward compatible - old fields in same order)
CREATE OR REPLACE FUNCTION match_titles_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  -- Original fields (preserved for backward compatibility)
  title_id uuid,
  title_name_en text,
  title_name_kr text,
  description text,
  similarity float,
  -- New metadata fields (added at end for compatibility)
  synopsis text,
  genre text[],
  tone text,
  content_format text,
  perfect_for text,
  audience text,
  age_rating text,
  story_author text,
  art_author text,
  comps text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Original fields (same logic as before)
    t.title_id,
    t.title_name_en,
    t.title_name_kr,
    COALESCE(t.synopsis, t.description_kr, '')::text as description,
    CASE
      WHEN t.combined_embedding IS NOT NULL
      THEN (1 - (t.combined_embedding <=> query_embedding))::float
      ELSE 0::float
    END AS similarity,
    -- New metadata fields (all from titles table)
    t.synopsis,
    t.genre,
    t.tone,
    t.content_format::text,
    t.perfect_for,
    t.audience,
    t.age_rating,
    t.story_author,
    t.art_author,
    t.comps
  FROM titles t
  WHERE t.combined_embedding IS NOT NULL
    AND (1 - (t.combined_embedding <=> query_embedding)) > match_threshold
  ORDER BY t.combined_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Update function comment
COMMENT ON FUNCTION match_titles_by_embedding IS 'Vector similarity search with full title metadata (backward compatible)';

-- Test query (optional - run manually to verify)
-- SELECT * FROM match_titles_by_embedding(array_fill(0.1, ARRAY[1536])::vector, 0.1, 3);
