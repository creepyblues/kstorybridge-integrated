-- Check if tables exist first, then create them
-- This is a standalone SQL file you can run directly in Supabase SQL Editor

-- Drop tables if they exist (optional - remove if you want to keep existing data)
-- DROP TABLE IF EXISTS vector_search_analytics;
-- DROP TABLE IF EXISTS title_content_analysis;

-- Create vector search analytics table
CREATE TABLE IF NOT EXISTS vector_search_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    search_type TEXT CHECK (search_type IN ('vector', 'traditional', 'hybrid')) DEFAULT 'vector',
    result_count INTEGER DEFAULT 0,
    clicked_title_id TEXT,
    click_position INTEGER,
    search_duration_ms INTEGER,
    user_id TEXT,
    session_id TEXT NOT NULL,
    query_intent TEXT CHECK (query_intent IN ('browse', 'specific', 'research', 'comparison')) DEFAULT 'browse',
    query_complexity TEXT CHECK (query_complexity IN ('simple', 'medium', 'complex')) DEFAULT 'simple',
    user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5),
    refinements TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for vector_search_analytics
CREATE INDEX IF NOT EXISTS idx_vector_search_analytics_created_at ON vector_search_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_vector_search_analytics_query ON vector_search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_vector_search_analytics_user_id ON vector_search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_vector_search_analytics_session_id ON vector_search_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_vector_search_analytics_search_type ON vector_search_analytics(search_type);

-- Create title content analysis table
CREATE TABLE IF NOT EXISTS title_content_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title_id TEXT NOT NULL,
    semantic_tags TEXT[] DEFAULT '{}',
    mood_analysis JSONB DEFAULT '{}',
    character_types TEXT[] DEFAULT '{}',
    plot_elements TEXT[] DEFAULT '{}',
    cultural_elements TEXT[] DEFAULT '{}',
    target_demographics JSONB DEFAULT '{}',
    content_warnings TEXT[] DEFAULT '{}',
    keyword_density JSONB DEFAULT '{}',
    complexity_score DECIMAL(3,2) DEFAULT 5.0 CHECK (complexity_score >= 1.0 AND complexity_score <= 10.0),
    content_quality_score DECIMAL(3,2) DEFAULT 5.0 CHECK (content_quality_score >= 0.0 AND content_quality_score <= 10.0),
    search_boost_factor DECIMAL(3,2) DEFAULT 1.0 CHECK (search_boost_factor >= 0.5 AND search_boost_factor <= 2.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(title_id)
);

-- Create indexes for title_content_analysis
CREATE INDEX IF NOT EXISTS idx_title_content_analysis_title_id ON title_content_analysis(title_id);
CREATE INDEX IF NOT EXISTS idx_title_content_analysis_complexity_score ON title_content_analysis(complexity_score);
CREATE INDEX IF NOT EXISTS idx_title_content_analysis_quality_score ON title_content_analysis(content_quality_score);
CREATE INDEX IF NOT EXISTS idx_title_content_analysis_semantic_tags ON title_content_analysis USING GIN(semantic_tags);

-- Add foreign key constraint for title_content_analysis if titles table exists
-- Note: We're not adding the foreign key constraint here as it might cause issues
-- if the titles table structure is different. Add manually if needed:
-- ALTER TABLE title_content_analysis ADD CONSTRAINT fk_title_content_analysis_title_id 
-- FOREIGN KEY (title_id) REFERENCES titles(title_id) ON DELETE CASCADE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for title_content_analysis updated_at
DROP TRIGGER IF EXISTS update_title_content_analysis_updated_at ON title_content_analysis;
CREATE TRIGGER update_title_content_analysis_updated_at 
    BEFORE UPDATE ON title_content_analysis 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE vector_search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_content_analysis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own search analytics" ON vector_search_analytics;
DROP POLICY IF EXISTS "Users can insert their own search analytics" ON vector_search_analytics;
DROP POLICY IF EXISTS "Authenticated users can view title content analysis" ON title_content_analysis;
DROP POLICY IF EXISTS "Service role can manage title content analysis" ON title_content_analysis;

-- RLS Policies for vector_search_analytics
CREATE POLICY "Users can view their own search analytics" ON vector_search_analytics
    FOR SELECT USING (auth.uid()::text = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own search analytics" ON vector_search_analytics
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);

-- RLS Policies for title_content_analysis (readable by all authenticated users)
CREATE POLICY "Authenticated users can view title content analysis" ON title_content_analysis
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage title content analysis" ON title_content_analysis
    FOR ALL USING (auth.role() = 'service_role');

-- Verify tables were created
SELECT 'vector_search_analytics table created' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vector_search_analytics');

SELECT 'title_content_analysis table created' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'title_content_analysis');