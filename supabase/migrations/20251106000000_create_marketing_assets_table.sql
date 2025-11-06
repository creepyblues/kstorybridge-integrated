-- Migration: Create title_marketing_assets table
-- Description: Table for tracking AI-generated marketing assets (images/videos)
-- Created: 2025-11-06
-- Feature: Creative Asset Generation System
-- Status: ACTIVE

-- ============================================================================
-- TABLE: title_marketing_assets
-- ============================================================================

CREATE TABLE IF NOT EXISTS title_marketing_assets (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign key to titles
  title_id UUID NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,

  -- Asset categorization
  asset_category TEXT NOT NULL CHECK (asset_category IN (
    'social_media',   -- Instagram, Facebook, Twitter posts
    'ad_creative',    -- Display ads, YouTube thumbnails
    'pitch_material'  -- Concept art, key scenes, character cards
  )),
  asset_type TEXT NOT NULL, -- Specific type: 'instagram_story', 'poster', 'concept_art', etc.
  asset_format TEXT, -- Dimensions: '1080x1920', '1200x628', '1024x1024', etc.

  -- Content
  description TEXT NOT NULL, -- What this asset represents
  prompt_template TEXT NOT NULL, -- Original AI-generated prompt
  prompt_used TEXT, -- Actual prompt used for generation (if edited by admin)

  -- Generated assets (URLs)
  image_url TEXT, -- Supabase Storage path for generated image
  video_url TEXT, -- Future: Supabase Storage path for generated video

  -- Generation metadata
  generation_api TEXT CHECK (generation_api IN ('dall-e-3', 'openai-video')),
  generation_model TEXT, -- Model version: 'dall-e-3', 'dall-e-3-hd', etc.
  generation_cost NUMERIC(10,4) DEFAULT 0, -- Cost in USD
  generation_attempts INTEGER DEFAULT 0, -- Number of generation attempts
  error_message TEXT, -- Error message if generation failed

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Idea created, not generated yet
    'generating',   -- API call in progress
    'completed',    -- Successfully generated
    'failed'        -- Generation failed
  )),

  -- Approval workflow
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES admin(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_image_or_video CHECK (
    image_url IS NOT NULL OR video_url IS NOT NULL OR status IN ('pending', 'generating', 'failed')
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for querying assets by title
CREATE INDEX idx_marketing_assets_title
  ON title_marketing_assets(title_id);

-- Index for querying by status (for admin dashboard)
CREATE INDEX idx_marketing_assets_status
  ON title_marketing_assets(status);

-- Index for querying by category
CREATE INDEX idx_marketing_assets_category
  ON title_marketing_assets(asset_category);

-- Composite index for filtering by title and status
CREATE INDEX idx_marketing_assets_title_status
  ON title_marketing_assets(title_id, status);

-- Index for approved assets
CREATE INDEX idx_marketing_assets_approved
  ON title_marketing_assets(approved)
  WHERE approved = TRUE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE title_marketing_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can view all marketing assets
CREATE POLICY "Admin can view all marketing assets"
  ON title_marketing_assets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = (auth.jwt() ->> 'email')::text
      AND admin.active = true
    )
  );

-- Policy: Admin can insert marketing assets
CREATE POLICY "Admin can insert marketing assets"
  ON title_marketing_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = (auth.jwt() ->> 'email')::text
      AND admin.active = true
    )
  );

-- Policy: Admin can update marketing assets
CREATE POLICY "Admin can update marketing assets"
  ON title_marketing_assets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = (auth.jwt() ->> 'email')::text
      AND admin.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = (auth.jwt() ->> 'email')::text
      AND admin.active = true
    )
  );

-- Policy: Admin can delete marketing assets
CREATE POLICY "Admin can delete marketing assets"
  ON title_marketing_assets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = (auth.jwt() ->> 'email')::text
      AND admin.active = true
    )
  );

-- ============================================================================
-- FUNCTION: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_marketing_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_marketing_assets_timestamp
  BEFORE UPDATE ON title_marketing_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_assets_updated_at();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE title_marketing_assets IS
  'Stores AI-generated marketing asset ideas and their generated images/videos';

COMMENT ON COLUMN title_marketing_assets.asset_category IS
  'Category: social_media, ad_creative, or pitch_material';

COMMENT ON COLUMN title_marketing_assets.status IS
  'Generation status: pending, generating, completed, or failed';

COMMENT ON COLUMN title_marketing_assets.generation_cost IS
  'Cost in USD for generating this asset';

COMMENT ON COLUMN title_marketing_assets.prompt_template IS
  'Original AI-generated prompt from analysis';

COMMENT ON COLUMN title_marketing_assets.prompt_used IS
  'Actual prompt used (if admin edited before generation)';
