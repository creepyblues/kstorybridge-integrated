-- Migration: Create title_drafts table for auto-save functionality
-- Date: 2025-10-24
-- Status: IN_PROGRESS
-- Description: Store auto-saved draft data for incomplete title submissions
--
-- This migration enables creators to save progress and resume the 5-step
-- questionnaire later. One draft per creator (UNIQUE constraint).

BEGIN;

-- Create title_drafts table
CREATE TABLE IF NOT EXISTS public.title_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_draft_per_creator UNIQUE(creator_id)
);

-- Create indexes for performance
CREATE INDEX idx_title_drafts_creator_id ON public.title_drafts(creator_id);
CREATE INDEX idx_title_drafts_last_saved ON public.title_drafts(last_saved_at DESC);

-- Enable Row Level Security
ALTER TABLE public.title_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Creators can manage their own drafts
CREATE POLICY "Creators manage their own drafts"
ON public.title_drafts FOR ALL
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_title_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_title_drafts_updated_at
    BEFORE UPDATE ON public.title_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_title_drafts_updated_at();

-- Add table comments
COMMENT ON TABLE public.title_drafts IS 'Auto-saved draft data for incomplete title submissions (one per creator)';
COMMENT ON COLUMN public.title_drafts.draft_data IS 'JSONB containing form data from all 5 steps';
COMMENT ON COLUMN public.title_drafts.current_step IS 'Current step number (1-5) when draft was last saved';
COMMENT ON COLUMN public.title_drafts.last_saved_at IS 'Timestamp of last auto-save (displayed to user)';

COMMIT;
