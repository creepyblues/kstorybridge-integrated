-- Migration: Fix title_content_analysis.title_id type mismatch
-- Date: 2025-11-04
-- Purpose: Fix foreign key relationship between titles and title_content_analysis
-- Issue: title_id was TEXT instead of UUID, breaking Supabase relationship queries
-- Status: CORRECTIVE (fixes production issue)

-- Drop existing table (has wrong TEXT type for title_id)
DROP TABLE IF EXISTS title_content_analysis CASCADE;

-- Recreate with correct UUID type (consolidates schemas from multiple migrations)
CREATE TABLE title_content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,

  -- Semantic analysis
  semantic_tags JSONB DEFAULT '[]',
  mood_analysis JSONB DEFAULT '{}',
  character_types TEXT[] DEFAULT '{}',
  plot_elements TEXT[] DEFAULT '{}',
  cultural_elements TEXT[] DEFAULT '{}',

  -- Content metrics
  complexity_score DECIMAL(3,2) DEFAULT 5.0 CHECK (complexity_score >= 1.0 AND complexity_score <= 10.0),
  reading_time_minutes INTEGER,
  content_quality_score DECIMAL(3,2) DEFAULT 5.0 CHECK (content_quality_score >= 0.0 AND content_quality_score <= 10.0),

  -- Audience analysis
  target_demographics JSONB DEFAULT '{}',
  content_warnings TEXT[] DEFAULT '{}',
  accessibility_features TEXT[] DEFAULT '{}',

  -- Search optimization
  keyword_density JSONB DEFAULT '{}',
  search_boost_factor DECIMAL(3,2) DEFAULT 1.0 CHECK (search_boost_factor >= 0.5 AND search_boost_factor <= 2.0),

  -- Pitch analytics (added in later migration)
  pitch_analysis JSONB DEFAULT '{}',

  -- Processing metadata
  analysis_version TEXT DEFAULT '1.0',
  processed_by TEXT DEFAULT 'openai-gpt-4',
  processing_confidence FLOAT DEFAULT 0.0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(title_id)
);

-- Create indexes for performance
CREATE INDEX idx_title_content_analysis_title_id ON title_content_analysis(title_id);
CREATE INDEX idx_title_content_analysis_updated_at ON title_content_analysis(updated_at);
CREATE INDEX idx_title_content_analysis_complexity_score ON title_content_analysis(complexity_score);
CREATE INDEX idx_title_content_analysis_quality_score ON title_content_analysis(content_quality_score);
CREATE INDEX idx_title_content_analysis_semantic_tags ON title_content_analysis USING GIN(semantic_tags);

-- Enable RLS
ALTER TABLE title_content_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies (readable by all authenticated users, writable by service role only)
CREATE POLICY "Authenticated users can view title content analysis"
  ON title_content_analysis
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage title content analysis"
  ON title_content_analysis
  FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_title_content_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_title_content_analysis_updated_at
  BEFORE UPDATE ON title_content_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_title_content_analysis_updated_at();

-- Add comments for documentation
COMMENT ON TABLE title_content_analysis IS 'Enhanced content analysis with semantic understanding and pitch analytics for search';
COMMENT ON COLUMN title_content_analysis.title_id IS 'Foreign key to titles table (UUID type - CRITICAL for Supabase relationships)';
COMMENT ON COLUMN title_content_analysis.pitch_analysis IS 'JSONB containing pitch deck analytics for chatbot responses';
COMMENT ON COLUMN title_content_analysis.processing_confidence IS 'AI processing confidence score (0.0-1.0)';

-- Migration Notes:
-- - Fixes type mismatch: title_id changed from TEXT to UUID
-- - Consolidates schemas from migrations 20250829100000, 20250908000001, 20251021000000
-- - Drops existing table (safe because relationship was broken anyway)
-- - Restores Supabase relationship query capability: titles -> title_content_analysis
-- - All data will need to be re-processed by AI analysis jobs
