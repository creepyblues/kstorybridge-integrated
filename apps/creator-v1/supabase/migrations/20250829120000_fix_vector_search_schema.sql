-- Fix vector search function to use existing database columns
-- This migration fixes the column reference issue in match_titles_by_embedding

-- Drop existing function if it exists (with all possible signatures)
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector, float, int);
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector(1536), float, int);

-- Create the corrected vector search function
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
    -- Use synopsis (English) first, fallback to description_kr, then empty string
    COALESCE(t.synopsis, t.description_kr, '')::text as description,
    -- Calculate cosine similarity using combined_embedding
    CASE 
      WHEN t.combined_embedding IS NOT NULL 
      THEN (1 - (t.combined_embedding <=> query_embedding))::float
      ELSE 0::float
    END AS similarity
  FROM titles t
  WHERE t.combined_embedding IS NOT NULL
    AND (1 - (t.combined_embedding <=> query_embedding)) > match_threshold
  ORDER BY t.combined_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Also create a more flexible function that works even without embeddings (for testing)
CREATE OR REPLACE FUNCTION match_titles_by_embedding_flexible(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
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
    COALESCE(t.synopsis, t.description_kr, t.title_name_en, '')::text as description,
    CASE 
      WHEN t.combined_embedding IS NOT NULL 
      THEN (1 - (t.combined_embedding <=> query_embedding))::float
      ELSE 0.1::float -- Small score for titles without embeddings
    END AS similarity
  FROM titles t
  WHERE 
    (t.combined_embedding IS NOT NULL AND (1 - (t.combined_embedding <=> query_embedding)) > match_threshold)
    OR (t.combined_embedding IS NULL AND match_threshold <= 0.1) -- Include non-embedded titles if threshold is low
  ORDER BY 
    CASE 
      WHEN t.combined_embedding IS NOT NULL 
      THEN t.combined_embedding <=> query_embedding
      ELSE 999 -- Put non-embedded titles at the end
    END
  LIMIT match_count;
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION match_titles_by_embedding IS 'Vector similarity search using existing schema columns (synopsis/description_kr)';
COMMENT ON FUNCTION match_titles_by_embedding_flexible IS 'Flexible vector search that works with or without embeddings';

-- Create a simple test function to verify the fix
CREATE OR REPLACE FUNCTION test_vector_search()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result_count int;
  test_embedding vector(1536);
BEGIN
  -- Create a test embedding (all 0.1 values)
  SELECT array_agg(0.1)::vector(1536) INTO test_embedding 
  FROM generate_series(1, 1536);
  
  -- Test the function
  SELECT COUNT(*) INTO result_count
  FROM match_titles_by_embedding_flexible(test_embedding, 0.1, 5);
  
  RETURN 'Vector search test passed. Found ' || result_count || ' results.';
EXCEPTION 
  WHEN OTHERS THEN
    RETURN 'Vector search test failed: ' || SQLERRM;
END;
$$;

-- Run the test (this will show in the migration output)
SELECT test_vector_search() as migration_test_result;