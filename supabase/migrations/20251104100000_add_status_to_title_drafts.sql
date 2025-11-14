-- Migration: Add submission approval workflow to title_drafts table
-- Created: 2025-11-04
-- Purpose: Enable draft submission → admin approval workflow instead of immediate publish
-- NOTE: Only applies if title_drafts table exists (creator app specific)

DO $$
BEGIN
  -- Only proceed if title_drafts table exists
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'title_drafts'
  ) THEN
    -- Add status column with check constraint
    ALTER TABLE title_drafts
    ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));

    -- Add workflow timestamps
    ALTER TABLE title_drafts
    ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
    ADD COLUMN IF NOT EXISTS approved_at timestamptz,
    ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

    -- Add admin metadata
    ALTER TABLE title_drafts
    ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS rejection_reason text;

    -- Add indexes for efficient querying
    CREATE INDEX IF NOT EXISTS idx_title_drafts_status ON title_drafts(status);
    CREATE INDEX IF NOT EXISTS idx_title_drafts_submitted_at ON title_drafts(submitted_at);
    CREATE INDEX IF NOT EXISTS idx_title_drafts_creator_status ON title_drafts(creator_id, status);

    -- Comment on columns for documentation
    COMMENT ON COLUMN title_drafts.status IS 'Workflow status: draft (auto-saving), submitted (pending admin review), approved (admin approved and moved to titles table), rejected (admin rejected with reason)';
    COMMENT ON COLUMN title_drafts.submitted_at IS 'Timestamp when creator clicked Submit Title button';
    COMMENT ON COLUMN title_drafts.approved_at IS 'Timestamp when admin approved the submission';
    COMMENT ON COLUMN title_drafts.rejected_at IS 'Timestamp when admin rejected the submission';
    COMMENT ON COLUMN title_drafts.approved_by IS 'Admin user ID who approved or rejected the submission';
    COMMENT ON COLUMN title_drafts.rejection_reason IS 'Admin feedback explaining why submission was rejected (visible to creator)';
  END IF;
END $$;
