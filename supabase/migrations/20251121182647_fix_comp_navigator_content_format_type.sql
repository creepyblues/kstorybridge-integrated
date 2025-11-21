-- Fix content_format Type Casting in Comps Navigator RPC
-- Migration: 20251121182647_fix_comp_navigator_content_format_type
--
-- ISSUE: content_format is an ENUM type in the database but the RPC function
-- declares it as text, causing "structure of query does not match function result type" error
--
-- SOLUTION: Cast content_format::text in the SELECT statement

-- Drop and recreate the function with proper type casting
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
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.title_id,
    t.title_name_en,
    t.title_name_kr,
    t.synopsis,
    t.description_kr as description,
    t.genre,
    t.tone,
    t.content_format::text,  -- Cast ENUM to text to match return type
    t.title_image,
    (1 - (t.combined_embedding <=> query_embedding)) AS similarity
  FROM titles t
  WHERE t.combined_embedding IS NOT NULL
    AND (t.combined_embedding <=> query_embedding) < (1 - match_threshold)
  ORDER BY t.combined_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_titles_by_embedding_optimized IS
'Optimized vector search for Comps Navigator with proper type casting for ENUM fields';

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_titles_by_embedding_optimized(vector(1536), float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION match_titles_by_embedding_optimized(vector(1536), float, int) TO service_role;
