-- Migration: Create title_marketing_assets table (ISOLATED DESIGN)
-- Description: Standalone table for AI-generated marketing assets with NO foreign keys
-- Created: 2025-11-06 (Refactored for complete isolation)
-- Feature: Creative Asset Generation System
-- Status: ACTIVE
--
-- DESIGN PHILOSOPHY:
-- This table is completely isolated from existing app database structures.
-- - NO foreign keys (no referential integrity dependencies)
-- - NO RLS queries to other tables (admin list hardcoded)
-- - Stores all context directly (title_name, admin_email, etc.)
-- - Can work as standalone tool or microservice

-- ============================================================================
-- TABLE: title_marketing_assets (ISOLATED)
-- ============================================================================

CREATE TABLE IF NOT EXISTS title_marketing_assets (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Title reference (TEXT, not enforced foreign key)
  title_id TEXT NOT NULL,              -- External ID (can be UUID string)
  title_name TEXT NOT NULL,             -- Stored directly, no lookup needed

  -- Asset categorization
  asset_category TEXT NOT NULL CHECK (asset_category IN (
    'social_media',   -- Instagram, Facebook, Twitter posts
    'ad_creative',    -- Display ads, YouTube thumbnails
    'pitch_material'  -- Concept art, key scenes, character cards
  )),
  asset_type TEXT NOT NULL,             -- Specific type: 'instagram_story', 'poster', etc.
  asset_format TEXT,                    -- Dimensions: '1080x1920', '1200x628', etc.

  -- Content
  description TEXT NOT NULL,            -- What this asset represents
  prompt_template TEXT NOT NULL,        -- Original AI-generated prompt
  prompt_used TEXT,                     -- Actual prompt used (if edited by admin)

  -- Generated assets (URLs)
  image_url TEXT,                       -- Supabase Storage path
  video_url TEXT,                       -- Future: video generation

  -- Generation metadata
  generation_api TEXT CHECK (generation_api IN ('dall-e-3', 'openai-video')),
  generation_model TEXT,                -- Model version: 'dall-e-3', 'dall-e-3-hd'
  generation_cost NUMERIC(10,4) DEFAULT 0, -- Cost in USD
  generation_attempts INTEGER DEFAULT 0,    -- Number of attempts
  error_message TEXT,                   -- Error if generation failed

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Idea created, not generated yet
    'generating',   -- API call in progress
    'completed',    -- Successfully generated
    'failed'        -- Generation failed
  )),

  -- Approval workflow (admin info stored as text, NO foreign key)
  approved BOOLEAN DEFAULT FALSE,
  approved_by_email TEXT,               -- Email stored directly (e.g., 'sungho@dadble.com')
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

-- Index for querying assets by title (text search)
CREATE INDEX idx_marketing_assets_title_id
  ON title_marketing_assets(title_id);

-- Index for querying by status
CREATE INDEX idx_marketing_assets_status
  ON title_marketing_assets(status);

-- Index for querying by category
CREATE INDEX idx_marketing_assets_category
  ON title_marketing_assets(asset_category);

-- Composite index for filtering
CREATE INDEX idx_marketing_assets_title_status
  ON title_marketing_assets(title_id, status);

-- Index for approved assets
CREATE INDEX idx_marketing_assets_approved
  ON title_marketing_assets(approved)
  WHERE approved = TRUE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - ISOLATED (NO TABLE QUERIES)
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE title_marketing_assets ENABLE ROW LEVEL SECURITY;

-- ISOLATED POLICY: Check JWT email directly, NO admin table lookup
-- This makes the feature completely independent of existing database structures
CREATE POLICY "Admins can view all marketing assets"
  ON title_marketing_assets
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (
      'sungho@dadble.com',
      'kevin@sandstoneartists.com'
    )
  );

CREATE POLICY "Admins can insert marketing assets"
  ON title_marketing_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email') IN (
      'sungho@dadble.com',
      'kevin@sandstoneartists.com'
    )
  );

CREATE POLICY "Admins can update marketing assets"
  ON title_marketing_assets
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (
      'sungho@dadble.com',
      'kevin@sandstoneartists.com'
    )
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') IN (
      'sungho@dadble.com',
      'kevin@sandstoneartists.com'
    )
  );

CREATE POLICY "Admins can delete marketing assets"
  ON title_marketing_assets
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (
      'sungho@dadble.com',
      'kevin@sandstoneartists.com'
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
  'ISOLATED: Stores AI-generated marketing asset ideas and generated images/videos. NO foreign keys - completely independent from other database structures.';

COMMENT ON COLUMN title_marketing_assets.title_id IS
  'External reference only (TEXT, not enforced FK). Can be UUID string or any identifier.';

COMMENT ON COLUMN title_marketing_assets.title_name IS
  'Title name stored directly to avoid lookups. Passed as parameter during creation.';

COMMENT ON COLUMN title_marketing_assets.approved_by_email IS
  'Admin email stored directly (no FK to admin table). E.g., sungho@dadble.com';

COMMENT ON COLUMN title_marketing_assets.generation_cost IS
  'Cost in USD for generating this asset (e.g., $0.08 for DALL-E 3 HD)';

-- ============================================================================
-- ISOLATION NOTES
-- ============================================================================

-- This migration creates a FULLY ISOLATED table:
-- ✅ NO foreign keys (no referential integrity dependencies)
-- ✅ NO RLS queries to other tables (admin emails hardcoded)
-- ✅ Stores all context directly (title_name, admin_email)
-- ✅ Can work as standalone tool
-- ✅ Can be extracted to separate microservice
-- ✅ Changes to titles/admin tables won't affect this

-- To add a new admin, create a new migration:
-- ALTER POLICY "Admins can view all marketing assets" ...
-- USING ((auth.jwt() ->> 'email') IN ('sungho@dadble.com', 'kevin@sandstoneartists.com', 'new@admin.com'))
