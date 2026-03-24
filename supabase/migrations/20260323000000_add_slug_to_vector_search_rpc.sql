-- Add slug to match_titles_by_embedding_optimized RPC
-- Migration: 20260323000000_add_slug_to_vector_search_rpc
--
-- PURPOSE:
-- Add slug field to the vector search RPC so that all search results
-- (chat, comps navigator, mandate matcher) can use slug-based URLs
-- instead of UUIDs for consistent /buyers/titles/:slug routing.
--
-- ROLLBACK: Re-run previous migration (20251203110219) to restore function without slug

DROP FUNCTION IF EXISTS match_titles_by_embedding_optimized(vector(1536), float, int);

CREATE OR REPLACE FUNCTION match_titles_by_embedding_optimized(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 30
)
RETURNS TABLE (
  title_id uuid,
  slug text,
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
  RETURN QUERY
  SELECT
    t.title_id,
    t.slug,
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
'Optimized vector search with slug and priority fields for consistent slug-based URL routing.';

GRANT EXECUTE ON FUNCTION match_titles_by_embedding_optimized(vector(1536), float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION match_titles_by_embedding_optimized(vector(1536), float, int) TO service_role;
