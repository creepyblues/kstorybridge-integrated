-- Migration: Title Intelligence Data Table
-- Created: 2025-11-23
-- Purpose: Store raw intelligence data collected from multiple sources (Naver, Kakao, Reddit, AO3)
-- Status: ✅ COMPLETED (Applied to production 2025-11-23)
--
-- Features:
-- - Flexible JSONB storage for varying data structures across sources
-- - Field-level verification tracking
-- - Separation of raw data from verified title data
-- - Permanent data retention (raw data never deleted)
-- - Admin-only access via RLS
-- - Audit trail for collection, verification, and ingestion
--
-- Data Flow:
-- 1. Admin inputs title name in Title Investigator
-- 2. System collects data from sources (stored in raw_data as JSON)
-- 3. Admin verifies fields one by one (tracked in verified_fields)
-- 4. Approved fields ingested into titles table (raw data retained)
-- 5. Raw data kept permanently for historical reference

-- ============================================================================
-- Main Table: title_intelligence_data
-- ============================================================================

CREATE TABLE IF NOT EXISTS title_intelligence_data (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Search input (what admin typed)
  title_name_input text NOT NULL,

  -- Optional link to existing title (null if creating new title)
  title_id uuid REFERENCES titles(title_id) ON DELETE SET NULL,

  -- Collection metadata
  collected_by text NOT NULL,
  collected_at timestamptz NOT NULL DEFAULT now(),

  -- Data sources (checkboxes selected)
  sources_requested text[] NOT NULL DEFAULT '{}',
  -- Example: ['naver', 'kakao', 'reddit', 'ao3']

  -- Raw data from each source (flexible JSONB)
  raw_data jsonb NOT NULL DEFAULT '{}',
  -- Structure: { "naver": {...}, "kakao": {...}, "reddit": {...}, "ao3": {...} }
  -- Each source has different fields, so JSONB allows flexibility

  -- Collection status
  collection_status text NOT NULL DEFAULT 'pending',
  -- Values: pending | in_progress | completed | partial_failure | failed

  collection_errors jsonb DEFAULT '{}',
  -- Structure: { "naver": "Rate limited", "reddit": "API error" }

  -- Field-level verification tracking
  verified_fields jsonb DEFAULT '{}',
  -- Structure: {
  --   "naver.views": { "approved": true, "verified_by": "admin@example.com", "verified_at": "2025-11-23T10:00:00Z" },
  --   "naver.rating": { "approved": false, "rejected_reason": "Inaccurate data", "verified_by": "admin@example.com", "verified_at": "2025-11-23T10:01:00Z" },
  --   "kakao.chapters": { "approved": true, "verified_by": "admin@example.com", "verified_at": "2025-11-23T10:02:00Z" }
  -- }

  verification_status text NOT NULL DEFAULT 'pending',
  -- Values: pending | in_progress | completed | skipped

  verified_by text,
  verified_at timestamptz,

  -- Ingestion tracking (data moved to titles table)
  ingested boolean NOT NULL DEFAULT false,
  ingested_by text,
  ingested_at timestamptz,
  ingested_to_title_id uuid REFERENCES titles(title_id) ON DELETE SET NULL,

  -- Ingestion notes
  ingestion_notes text,
  -- Example: "Created new title from intelligence data" or "Updated existing title with Naver metrics"

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Search by title name input
CREATE INDEX IF NOT EXISTS idx_title_intelligence_title_name_input
  ON title_intelligence_data(title_name_input);

-- Filter by linked title
CREATE INDEX IF NOT EXISTS idx_title_intelligence_title_id
  ON title_intelligence_data(title_id)
  WHERE title_id IS NOT NULL;

-- Filter by verification status
CREATE INDEX IF NOT EXISTS idx_title_intelligence_verification_status
  ON title_intelligence_data(verification_status);

-- Filter by collection status
CREATE INDEX IF NOT EXISTS idx_title_intelligence_collection_status
  ON title_intelligence_data(collection_status);

-- Recent collections (for listing page)
CREATE INDEX IF NOT EXISTS idx_title_intelligence_created_at
  ON title_intelligence_data(created_at DESC);

-- Filter by collector (who ran the intelligence collection)
CREATE INDEX IF NOT EXISTS idx_title_intelligence_collected_by
  ON title_intelligence_data(collected_by);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE title_intelligence_data ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view intelligence data
CREATE POLICY "Admins can view all intelligence data"
  ON title_intelligence_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

-- Policy: Only admins can insert intelligence data
CREATE POLICY "Admins can insert intelligence data"
  ON title_intelligence_data
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

-- Policy: Only admins can update intelligence data
CREATE POLICY "Admins can update intelligence data"
  ON title_intelligence_data
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

-- Policy: Only admins can delete intelligence data (though we never delete raw data)
CREATE POLICY "Admins can delete intelligence data"
  ON title_intelligence_data
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_title_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_title_intelligence_updated_at
  BEFORE UPDATE ON title_intelligence_data
  FOR EACH ROW
  EXECUTE FUNCTION update_title_intelligence_updated_at();

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE title_intelligence_data IS 'Stores raw intelligence data collected from multiple sources (Naver, Kakao, Reddit, AO3). Data remains permanently even after ingestion into titles table.';

COMMENT ON COLUMN title_intelligence_data.title_name_input IS 'The title name as entered by the admin (search query)';
COMMENT ON COLUMN title_intelligence_data.title_id IS 'Optional link to existing title (null if creating new title from this data)';
COMMENT ON COLUMN title_intelligence_data.collected_by IS 'Admin email who initiated the intelligence collection';
COMMENT ON COLUMN title_intelligence_data.sources_requested IS 'Array of sources to collect from (e.g., ["naver", "kakao", "reddit", "ao3"])';
COMMENT ON COLUMN title_intelligence_data.raw_data IS 'Flexible JSONB storage for varying data structures across sources';
COMMENT ON COLUMN title_intelligence_data.collection_status IS 'Status: pending | in_progress | completed | partial_failure | failed';
COMMENT ON COLUMN title_intelligence_data.collection_errors IS 'JSONB map of source-specific errors (e.g., {"naver": "Rate limited"})';
COMMENT ON COLUMN title_intelligence_data.verified_fields IS 'JSONB tracking field-level approvals/rejections with admin and timestamp';
COMMENT ON COLUMN title_intelligence_data.verification_status IS 'Status: pending | in_progress | completed | skipped';
COMMENT ON COLUMN title_intelligence_data.ingested IS 'Whether approved fields have been ingested into titles table';
COMMENT ON COLUMN title_intelligence_data.ingested_to_title_id IS 'The title_id where data was ingested (may differ from title_id if creating new title)';
COMMENT ON COLUMN title_intelligence_data.ingestion_notes IS 'Free-text notes about the ingestion process';
