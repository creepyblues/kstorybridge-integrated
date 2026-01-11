/**
 * Title Edit History Table
 *
 * Purpose: Track all admin/creator edits to titles for data governance and audit compliance.
 * Part of Data Governance Phase 2 implementation.
 *
 * Created: 2026-01-08
 * Status: PENDING
 *
 * Related:
 *   - Phase 1: intelligence_ingestion_log (already exists)
 *   - Phase 3: provenance columns on titles table (planned)
 */

-- ============================================================================
-- 1. Title Edit History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS title_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target title
  title_id uuid NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,

  -- Who made the edit
  edited_by text NOT NULL,  -- email of editor

  -- Source of edit
  edit_source text NOT NULL DEFAULT 'admin'
    CHECK (edit_source IN ('admin', 'creator', 'system', 'api')),

  -- What changed (JSON snapshot)
  -- Format: { "field_name": { "old": value, "new": value } }
  changed_fields jsonb NOT NULL,

  -- Optional reason/notes for the edit
  edit_reason text,

  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_title_edit_history_title ON title_edit_history(title_id);
CREATE INDEX IF NOT EXISTS idx_title_edit_history_edited_by ON title_edit_history(edited_by);
CREATE INDEX IF NOT EXISTS idx_title_edit_history_source ON title_edit_history(edit_source);
CREATE INDEX IF NOT EXISTS idx_title_edit_history_created_at ON title_edit_history(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE title_edit_history IS 'Audit trail of all edits to titles for data governance';
COMMENT ON COLUMN title_edit_history.edited_by IS 'Email of the user who made the edit';
COMMENT ON COLUMN title_edit_history.edit_source IS 'Source of edit: admin, creator, system, or api';
COMMENT ON COLUMN title_edit_history.changed_fields IS 'JSON snapshot of changes: { field: { old: value, new: value } }';

-- ============================================================================
-- 2. Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE title_edit_history ENABLE ROW LEVEL SECURITY;

-- Admin can view all edit history
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can view all edit history' AND tablename = 'title_edit_history') THEN
    CREATE POLICY "Admin can view all edit history"
      ON title_edit_history FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM admin
          WHERE admin.email = auth.jwt() ->> 'email'
          AND admin.active = true
        )
      );
  END IF;
END $$;

-- Admin can insert edit history
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can insert edit history' AND tablename = 'title_edit_history') THEN
    CREATE POLICY "Admin can insert edit history"
      ON title_edit_history FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM admin
          WHERE admin.email = auth.jwt() ->> 'email'
          AND admin.active = true
        )
      );
  END IF;
END $$;

-- Creators can view edit history for their own titles
-- Note: creator_id is UUID referencing auth.users(id)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creators can view own title edit history' AND tablename = 'title_edit_history') THEN
    CREATE POLICY "Creators can view own title edit history"
      ON title_edit_history FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM titles t
          WHERE t.title_id = title_edit_history.title_id
          AND t.creator_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Creators can insert edit history for their own titles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creators can insert own title edit history' AND tablename = 'title_edit_history') THEN
    CREATE POLICY "Creators can insert own title edit history"
      ON title_edit_history FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM titles t
          WHERE t.title_id = title_edit_history.title_id
          AND t.creator_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- End of Migration
-- ============================================================================
