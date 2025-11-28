/**
 * Intelligence Ingestion Control Tables
 *
 * Purpose: Add tables to manage admin review and controlled ingestion
 * of intelligence data into the main titles table.
 *
 * Created: 2025-11-27
 * Status: PENDING
 *
 * Depends on: 20251124000000_add_intelligence_schema.sql
 */

-- ============================================================================
-- 1. Ingestion Requests Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence_ingestion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source: Intelligence title being ingested
  intelligence_title_id uuid NOT NULL REFERENCES intelligence_titles(id) ON DELETE CASCADE,

  -- Target: Existing title in main system (UPDATE ONLY - no new title creation)
  target_title_id uuid NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,

  -- Field selections (which fields to ingest from which sources)
  -- Example: { "views": { "source_id": "uuid", "value": 15000000, "aggregation": "sum" } }
  field_selections jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Request metadata
  requested_by text NOT NULL,  -- Admin email
  requested_at timestamptz DEFAULT now(),
  request_notes text,

  -- Status tracking (same admin can execute immediately per requirements)
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),

  -- Execution tracking
  executed_at timestamptz,
  executed_by text,
  execution_result jsonb,  -- Success/error details

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_requests_intelligence ON intelligence_ingestion_requests(intelligence_title_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_requests_target ON intelligence_ingestion_requests(target_title_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_requests_status ON intelligence_ingestion_requests(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_requests_requested_by ON intelligence_ingestion_requests(requested_by);

COMMENT ON TABLE intelligence_ingestion_requests IS 'Admin requests to ingest intelligence data into main titles table';
COMMENT ON COLUMN intelligence_ingestion_requests.field_selections IS 'JSON mapping of fields to source selections: { fieldName: { source_id, value, aggregation? } }';

-- ============================================================================
-- 2. Ingestion Audit Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence_ingestion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to the request (optional - direct ingestion allowed)
  ingestion_request_id uuid REFERENCES intelligence_ingestion_requests(id),

  -- Source and target tracking
  intelligence_title_id uuid NOT NULL,  -- Not FK to allow historical tracking if intel deleted
  target_title_id uuid NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,

  -- Snapshot of what was ingested (permanent audit record)
  -- Example: { "views": { "old_value": 1000, "new_value": 15000000, "source": "naver", "source_id": "uuid" } }
  ingested_fields jsonb NOT NULL,

  -- Metadata
  ingested_by text NOT NULL,  -- Admin email
  ingested_at timestamptz DEFAULT now(),
  notes text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_log_request ON intelligence_ingestion_log(ingestion_request_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_intelligence ON intelligence_ingestion_log(intelligence_title_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_target ON intelligence_ingestion_log(target_title_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_ingested_by ON intelligence_ingestion_log(ingested_by);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_ingested_at ON intelligence_ingestion_log(ingested_at DESC);

COMMENT ON TABLE intelligence_ingestion_log IS 'Permanent audit trail of all data ingested from intelligence system into titles';
COMMENT ON COLUMN intelligence_ingestion_log.ingested_fields IS 'Snapshot of each field change: { fieldName: { old_value, new_value, source, source_id } }';

-- ============================================================================
-- 3. Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE intelligence_ingestion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_ingestion_log ENABLE ROW LEVEL SECURITY;

-- Admin-only access for ingestion requests
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can view all ingestion requests' AND tablename = 'intelligence_ingestion_requests') THEN
    CREATE POLICY "Admin can view all ingestion requests"
      ON intelligence_ingestion_requests FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM admin
          WHERE admin.email = auth.jwt() ->> 'email'
          AND admin.active = true
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can insert ingestion requests' AND tablename = 'intelligence_ingestion_requests') THEN
    CREATE POLICY "Admin can insert ingestion requests"
      ON intelligence_ingestion_requests FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM admin
          WHERE admin.email = auth.jwt() ->> 'email'
          AND admin.active = true
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can update ingestion requests' AND tablename = 'intelligence_ingestion_requests') THEN
    CREATE POLICY "Admin can update ingestion requests"
      ON intelligence_ingestion_requests FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM admin
          WHERE admin.email = auth.jwt() ->> 'email'
          AND admin.active = true
        )
      );
  END IF;
END $$;

-- Admin-only access for ingestion log (read-only after creation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can view all ingestion logs' AND tablename = 'intelligence_ingestion_log') THEN
    CREATE POLICY "Admin can view all ingestion logs"
      ON intelligence_ingestion_log FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM admin
          WHERE admin.email = auth.jwt() ->> 'email'
          AND admin.active = true
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can insert ingestion logs' AND tablename = 'intelligence_ingestion_log') THEN
    CREATE POLICY "Admin can insert ingestion logs"
      ON intelligence_ingestion_log FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM admin
          WHERE admin.email = auth.jwt() ->> 'email'
          AND admin.active = true
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 4. Trigger for updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_ingestion_requests_updated_at ON intelligence_ingestion_requests;
CREATE TRIGGER update_ingestion_requests_updated_at
  BEFORE UPDATE ON intelligence_ingestion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_intelligence_updated_at();

-- ============================================================================
-- End of Migration
-- ============================================================================
