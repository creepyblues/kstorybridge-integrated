-- Fix vector search function to handle missing description column
-- and be more robust with column references

-- Enable the vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add missing columns if they don't exist (for compatibility)
ALTER TABLE titles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS synopsis TEXT;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS tone TEXT;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS note TEXT;

-- Add vector columns if they don't exist
ALTER TABLE titles ADD COLUMN IF NOT EXISTS combined_embedding vector(1536);
ALTER TABLE titles ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'text-embedding-ada-002';
ALTER TABLE titles ADD COLUMN IF NOT EXISTS embedding_created_at TIMESTAMPTZ;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector, float, int);

-- Create updated vector similarity search function with better error handling
CREATE OR REPLACE FUNCTION match_titles_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  title_id uuid,
  title_name_en text,
  title_name_kr text,
  description text,
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
    COALESCE(t.description, t.synopsis, '') as description,
    1 - (t.combined_embedding <=> query_embedding) AS similarity
  FROM titles t
  WHERE t.combined_embedding IS NOT NULL
    AND 1 - (t.combined_embedding <=> query_embedding) > match_threshold
  ORDER BY t.combined_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION match_titles_by_embedding IS 'Vector similarity search with robust column handling';

-- Test the function (this will return empty results initially, but won't error)
-- SELECT * FROM match_titles_by_embedding(array_fill(0, ARRAY[1536])::vector, 0.5, 5);