-- ========================================
-- COMPREHENSIVE EMBEDDING DATABASE FIX
-- ========================================
-- Run this SQL in Supabase SQL Editor to fix embedding storage issues

-- Step 1: Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Check and fix column types
-- The issue might be that embedding columns are JSONB instead of VECTOR type

-- First, let's see what type they currently are (this will show in results)
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'titles' 
  AND column_name IN ('combined_embedding', 'title_embedding', 'synopsis_embedding', 'content_embedding')
ORDER BY column_name;

-- Step 3: Drop and recreate columns with correct vector type
-- Only run this if the columns above show as 'jsonb' or 'text' instead of 'USER-DEFINED' with udt_name 'vector'

-- UNCOMMENT THE FOLLOWING LINES IF COLUMNS ARE NOT VECTOR TYPE:
-- ALTER TABLE titles DROP COLUMN IF EXISTS combined_embedding;
-- ALTER TABLE titles DROP COLUMN IF EXISTS title_embedding; 
-- ALTER TABLE titles DROP COLUMN IF EXISTS synopsis_embedding;
-- ALTER TABLE titles DROP COLUMN IF EXISTS content_embedding;

-- Add vector columns with correct type
ALTER TABLE titles ADD COLUMN IF NOT EXISTS combined_embedding vector(1536);
ALTER TABLE titles ADD COLUMN IF NOT EXISTS title_embedding vector(1536);
ALTER TABLE titles ADD COLUMN IF NOT EXISTS synopsis_embedding vector(1536);
ALTER TABLE titles ADD COLUMN IF NOT EXISTS content_embedding vector(1536);

-- Add metadata columns if missing
ALTER TABLE titles ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'text-embedding-ada-002';
ALTER TABLE titles ADD COLUMN IF NOT EXISTS embedding_created_at TIMESTAMPTZ;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- Step 4: Fix the vector search function
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector, float, int);
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector(1536), float, int);

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
    -- Use synopsis first, fallback to description_kr, then empty string
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

-- Step 5: Test the setup with a real vector
DO $$
DECLARE
  test_embedding vector(1536);
  test_title_id uuid;
  result_count int;
BEGIN
  -- Get first title ID
  SELECT title_id INTO test_title_id FROM titles LIMIT 1;
  
  -- Create test embedding
  SELECT array_agg(random() * 0.001)::vector(1536) INTO test_embedding 
  FROM generate_series(1, 1536);
  
  -- Test storing embedding
  UPDATE titles 
  SET combined_embedding = test_embedding,
      embedding_model = 'test-vector-storage',
      embedding_updated_at = NOW()
  WHERE title_id = test_title_id;
  
  -- Test vector search
  SELECT COUNT(*) INTO result_count
  FROM match_titles_by_embedding(test_embedding, 0.1, 5);
  
  -- Report results
  RAISE NOTICE 'Vector storage test: SUCCESS';
  RAISE NOTICE 'Vector search found % results', result_count;
  
  -- Clean up test data
  UPDATE titles 
  SET combined_embedding = NULL,
      embedding_model = NULL,
      embedding_updated_at = NULL
  WHERE title_id = test_title_id;
  
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'Vector test FAILED: %', SQLERRM;
END;
$$;

-- Step 6: Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS titles_combined_embedding_idx ON titles 
  USING ivfflat (combined_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS titles_title_embedding_idx ON titles 
  USING ivfflat (title_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS titles_synopsis_embedding_idx ON titles 
  USING ivfflat (synopsis_embedding vector_cosine_ops) WITH (lists = 100);

-- Step 7: Final verification
SELECT 
  'Database setup verification:' as status,
  COUNT(*) as total_titles,
  COUNT(combined_embedding) as titles_with_embeddings
FROM titles;

-- Show column types after fix
SELECT 
  'Column types after fix:' as status,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'titles' 
  AND column_name IN ('combined_embedding', 'title_embedding', 'synopsis_embedding', 'content_embedding')
ORDER BY column_name;

SELECT 'Vector database setup complete! You can now run generate-embeddings.js' as final_message;