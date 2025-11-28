-- Migration: Add pitch analytics to vector search results
-- Date: 2025-01-30
-- Purpose: Enable chatbot to use pitch deck analytics for richer responses
-- Status: PRODUCTION READY
-- Backward Compatible: YES (LEFT JOIN, optional fields at end)
-- Risk Level: LOW (proven pattern from 20250200000000 migration)

-- Drop existing function (all possible signatures)
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector, float, int);
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector(1536), float, int);

-- Recreate with pitch analytics fields (backward compatible)
CREATE OR REPLACE FUNCTION match_titles_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  -- EXISTING 15 fields (SAME ORDER - critical for backward compatibility!)
  title_id uuid,
  title_name_en text,
  title_name_kr text,
  description text,
  similarity float,
  synopsis text,
  genre text[],
  tone text,
  content_format text,
  perfect_for text,
  audience text,
  age_rating text,
  story_author text,
  art_author text,
  comps text[],

  -- NEW FIELDS (at end for backward compatibility)
  pitch_analysis jsonb,
  processing_confidence float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Existing fields from titles table (unchanged logic)
    t.title_id,
    t.title_name_en,
    t.title_name_kr,
    COALESCE(t.synopsis, t.description_kr, '')::text as description,
    (1 - (t.combined_embedding <=> query_embedding))::float AS similarity,
    t.synopsis,
    t.genre,
    t.tone,
    t.content_format::text,
    t.perfect_for,
    t.audience,
    t.age_rating,
    t.story_author,
    t.art_author,
    t.comps,

    -- New fields from title_content_analysis (LEFT JOIN for safety)
    tca.pitch_analysis,
    tca.processing_confidence
  FROM titles t
  LEFT JOIN title_content_analysis tca ON t.title_id = tca.title_id
  WHERE t.combined_embedding IS NOT NULL
    AND (1 - (t.combined_embedding <=> query_embedding)) > match_threshold
  ORDER BY t.combined_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Update function comment
COMMENT ON FUNCTION match_titles_by_embedding IS 'Vector similarity search with pitch analytics (backward compatible, LEFT JOIN ensures titles without pitch still included)';

-- Migration Notes:
-- - LEFT JOIN ensures titles without pitch_analysis are NOT excluded (critical for backward compatibility)
-- - New fields at END preserve existing field order (TypeScript destructuring continues working)
-- - Pattern identical to successful 20250200000000 migration (proven safe)
-- - Rollback: Revert to previous function version (SQL script in PITCH_ANALYTICS_CHATBOT_INTEGRATION_PLAN.md)
-- - Testing: Run test query below to verify

-- Test query (optional - run manually to verify)
-- SELECT
--   title_name_en,
--   pitch_analysis IS NOT NULL as has_pitch,
--   processing_confidence
-- FROM match_titles_by_embedding(
--   array_fill(0.1, ARRAY[1536])::vector,
--   0.1,
--   10
-- );
