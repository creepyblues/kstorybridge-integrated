-- Enable the vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add missing columns if they don't exist (for compatibility)
ALTER TABLE titles ADD COLUMN IF NOT EXISTS synopsis TEXT;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS tone TEXT;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS note TEXT;

-- Add vector columns to existing titles table
ALTER TABLE titles 
  ADD COLUMN IF NOT EXISTS content_embedding vector(1536),
  ADD COLUMN IF NOT EXISTS title_embedding vector(1536),
  ADD COLUMN IF NOT EXISTS description_embedding vector(1536),
  ADD COLUMN IF NOT EXISTS combined_embedding vector(1536),
  ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'text-embedding-ada-002',
  ADD COLUMN IF NOT EXISTS embedding_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- Create enhanced content analysis table
CREATE TABLE IF NOT EXISTS title_content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  
  -- Semantic analysis
  semantic_tags JSONB DEFAULT '[]', -- AI-extracted themes, concepts
  mood_analysis JSONB DEFAULT '{}', -- Emotional tone analysis
  character_types TEXT[] DEFAULT '{}', -- Character archetypes
  plot_elements TEXT[] DEFAULT '{}', -- Story elements
  cultural_elements TEXT[] DEFAULT '{}', -- Korean cultural references
  
  -- Content metrics
  complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
  reading_time_minutes INTEGER,
  content_quality_score FLOAT CHECK (content_quality_score >= 0 AND content_quality_score <= 1),
  
  -- Audience analysis
  target_demographics JSONB DEFAULT '{}', -- Age, interests, etc.
  content_warnings TEXT[] DEFAULT '{}',
  accessibility_features TEXT[] DEFAULT '{}',
  
  -- Search optimization
  keyword_density JSONB DEFAULT '{}', -- Important keywords and frequency
  search_boost_factor FLOAT DEFAULT 1.0, -- Manual boost for search ranking
  
  -- Processing metadata
  analysis_version TEXT DEFAULT '1.0',
  processed_by TEXT DEFAULT 'openai-gpt-4',
  processing_confidence FLOAT DEFAULT 0.0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(title_id)
);

-- Create vector similarity search functions
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
    t.description,
    1 - (t.combined_embedding <=> query_embedding) AS similarity
  FROM titles t
  WHERE t.combined_embedding IS NOT NULL
    AND 1 - (t.combined_embedding <=> query_embedding) > match_threshold
  ORDER BY t.combined_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create hybrid search function (combines vector and text search)
CREATE OR REPLACE FUNCTION hybrid_search_titles(
  query_text text,
  query_embedding vector(1536),
  text_weight float DEFAULT 0.3,
  vector_weight float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  title_id uuid,
  title_name_en text,
  title_name_kr text,
  description text,
  text_score float,
  vector_score float,
  combined_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.title_id,
    t.title_name_en,
    t.title_name_kr,
    t.description,
    -- Text search score using ts_rank
    COALESCE(ts_rank(
      to_tsvector('english', COALESCE(t.title_name_en, '') || ' ' || COALESCE(t.title_name_kr, '') || ' ' || COALESCE(t.description, '') || ' ' || COALESCE(t.synopsis, '')),
      plainto_tsquery('english', query_text)
    ), 0) AS text_score,
    -- Vector similarity score
    COALESCE(1 - (t.combined_embedding <=> query_embedding), 0) AS vector_score,
    -- Combined weighted score
    (text_weight * COALESCE(ts_rank(
      to_tsvector('english', COALESCE(t.title_name_en, '') || ' ' || COALESCE(t.title_name_kr, '') || ' ' || COALESCE(t.description, '') || ' ' || COALESCE(t.synopsis, '')),
      plainto_tsquery('english', query_text)
    ), 0) + 
    vector_weight * COALESCE(1 - (t.combined_embedding <=> query_embedding), 0)) AS combined_score
  FROM titles t
  WHERE t.combined_embedding IS NOT NULL
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Create search analytics table for tracking search performance
CREATE TABLE IF NOT EXISTS vector_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID REFERENCES chat_sessions(id),
  
  -- Search query information
  original_query TEXT NOT NULL,
  processed_query TEXT,
  query_embedding vector(1536),
  
  -- Search parameters
  search_type TEXT NOT NULL CHECK (search_type IN ('vector_only', 'hybrid', 'text_only')),
  match_threshold FLOAT,
  result_count INTEGER,
  
  -- Search results
  returned_title_ids UUID[], -- Array of returned title IDs
  top_similarity_scores FLOAT[], -- Top similarity scores
  search_duration_ms INTEGER,
  
  -- User interaction with results
  clicked_title_ids UUID[] DEFAULT '{}',
  user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5),
  
  -- Metadata
  embedding_model TEXT DEFAULT 'text-embedding-ada-002',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for vector search performance
CREATE INDEX IF NOT EXISTS titles_content_embedding_idx ON titles 
  USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS titles_combined_embedding_idx ON titles 
  USING ivfflat (combined_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS titles_title_embedding_idx ON titles 
  USING ivfflat (title_embedding vector_cosine_ops) WITH (lists = 100);

-- Add text search indexes to support hybrid search
CREATE INDEX IF NOT EXISTS titles_text_search_idx ON titles 
  USING gin(to_tsvector('english', COALESCE(title_name_en, '') || ' ' || COALESCE(title_name_kr, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(synopsis, '')));

-- Add indexes for content analysis table
CREATE INDEX IF NOT EXISTS title_content_analysis_title_id_idx ON title_content_analysis(title_id);
CREATE INDEX IF NOT EXISTS title_content_analysis_updated_at_idx ON title_content_analysis(updated_at);

-- Add indexes for search analytics
CREATE INDEX IF NOT EXISTS vector_search_analytics_user_id_idx ON vector_search_analytics(user_id);
CREATE INDEX IF NOT EXISTS vector_search_analytics_session_id_idx ON vector_search_analytics(session_id);
CREATE INDEX IF NOT EXISTS vector_search_analytics_created_at_idx ON vector_search_analytics(created_at);
CREATE INDEX IF NOT EXISTS vector_search_analytics_search_type_idx ON vector_search_analytics(search_type);

-- Add RLS policies
ALTER TABLE title_content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS for content analysis (readable by all authenticated users)
CREATE POLICY "Content analysis visible to authenticated users" ON title_content_analysis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can modify content analysis" ON title_content_analysis
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM admin WHERE email = auth.jwt() ->> 'email'
    )
  );

-- RLS for search analytics (users can only see their own data)
CREATE POLICY "Users can view own search analytics" ON vector_search_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own search analytics" ON vector_search_analytics
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_title_content_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_title_content_analysis_updated_at
  BEFORE UPDATE ON title_content_analysis
  FOR EACH ROW EXECUTE FUNCTION update_title_content_analysis_updated_at();

-- Add comments for documentation
COMMENT ON TABLE title_content_analysis IS 'Enhanced content analysis with semantic understanding for better search';
COMMENT ON TABLE vector_search_analytics IS 'Analytics tracking for vector search performance and user behavior';
COMMENT ON FUNCTION match_titles_by_embedding IS 'Pure vector similarity search function';
COMMENT ON FUNCTION hybrid_search_titles IS 'Combines vector similarity with text search for better results';

-- Add sample data processing function for testing
CREATE OR REPLACE FUNCTION process_title_for_vector_search(target_title_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function would typically call external embedding service
  -- For now, it just updates the processing timestamp
  UPDATE titles 
  SET embedding_updated_at = NOW() 
  WHERE title_id = target_title_id;
  
  -- Log the processing
  RAISE NOTICE 'Title % marked for vector processing', target_title_id;
END;
$$;