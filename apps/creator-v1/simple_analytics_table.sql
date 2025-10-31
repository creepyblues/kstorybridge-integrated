-- Ultra-simple version to get started
-- Run this first to establish the basic table structure

-- Drop and recreate the table cleanly
DROP TABLE IF EXISTS vector_search_analytics CASCADE;
DROP TABLE IF EXISTS title_content_analysis CASCADE;

-- Create the most basic version of vector_search_analytics
CREATE TABLE vector_search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    search_type TEXT DEFAULT 'vector',
    result_count INTEGER DEFAULT 0,
    clicked_title_id TEXT,
    click_position INTEGER,
    search_duration_ms INTEGER,
    user_id TEXT,
    session_id TEXT NOT NULL,
    query_intent TEXT DEFAULT 'browse',
    query_complexity TEXT DEFAULT 'simple',
    user_satisfaction_score INTEGER,
    refinements TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX idx_vector_search_analytics_query ON vector_search_analytics(query);
CREATE INDEX idx_vector_search_analytics_created_at ON vector_search_analytics(created_at);
CREATE INDEX idx_vector_search_analytics_user_id ON vector_search_analytics(user_id);

-- Create the title content analysis table
CREATE TABLE title_content_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_id TEXT NOT NULL UNIQUE,
    semantic_tags TEXT[] DEFAULT '{}',
    mood_analysis JSONB DEFAULT '{}',
    character_types TEXT[] DEFAULT '{}',
    plot_elements TEXT[] DEFAULT '{}',
    cultural_elements TEXT[] DEFAULT '{}',
    target_demographics JSONB DEFAULT '{}',
    content_warnings TEXT[] DEFAULT '{}',
    keyword_density JSONB DEFAULT '{}',
    complexity_score NUMERIC(3,2) DEFAULT 5.0,
    content_quality_score NUMERIC(3,2) DEFAULT 5.0,
    search_boost_factor NUMERIC(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic indexes for title content analysis
CREATE INDEX idx_title_content_analysis_title_id ON title_content_analysis(title_id);

-- Enable RLS (Row Level Security)
ALTER TABLE vector_search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_content_analysis ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for testing (tighten later if needed)
CREATE POLICY "Allow all operations on vector_search_analytics" ON vector_search_analytics
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on title_content_analysis" ON title_content_analysis
    FOR ALL USING (true);

-- Test insert to verify everything works
INSERT INTO vector_search_analytics (query, session_id) 
VALUES ('test query', 'test-session-' || gen_random_uuid()::text);

-- Verify tables exist and have data
SELECT 'vector_search_analytics created' as status, COUNT(*) as rows FROM vector_search_analytics;
SELECT 'title_content_analysis created' as status, COUNT(*) as rows FROM title_content_analysis;

-- Clean up test data
DELETE FROM vector_search_analytics WHERE query = 'test query';

-- Show final table structure
\d vector_search_analytics;