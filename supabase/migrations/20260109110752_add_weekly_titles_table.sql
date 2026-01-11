-- Migration: Add weekly_titles table for Weekly Title admin feature
-- Purpose: Track weekly title assignments with editorial content
-- Date: 2026-01-09

-- Create weekly_titles table
CREATE TABLE IF NOT EXISTS public.weekly_titles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_of DATE NOT NULL UNIQUE, -- Monday of the week
  title_id UUID NOT NULL REFERENCES public.titles(title_id) ON DELETE CASCADE,
  -- Editorial content (stored here as input, then synced to titles table)
  input_logline TEXT,
  input_comparables TEXT,
  input_characters TEXT,
  input_synopsis TEXT,
  input_selling_points TEXT,
  -- Tracking
  created_by TEXT NOT NULL, -- admin email
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add selling_points column to titles if missing
ALTER TABLE public.titles
ADD COLUMN IF NOT EXISTS selling_points TEXT;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_titles_week_of ON public.weekly_titles(week_of);
CREATE INDEX IF NOT EXISTS idx_weekly_titles_title_id ON public.weekly_titles(title_id);

-- Enable RLS on weekly_titles
ALTER TABLE public.weekly_titles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_titles
-- Read: Anyone authenticated can read weekly titles
CREATE POLICY "Anyone can view weekly titles"
  ON public.weekly_titles
  FOR SELECT
  TO authenticated
  USING (true);

-- Write: Authenticated users can manage weekly titles (admin check at app level)
CREATE POLICY "Authenticated users can insert weekly titles"
  ON public.weekly_titles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update weekly titles"
  ON public.weekly_titles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete weekly titles"
  ON public.weekly_titles
  FOR DELETE
  TO authenticated
  USING (true);

-- Add trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_weekly_titles_updated_at ON public.weekly_titles;
CREATE TRIGGER update_weekly_titles_updated_at
  BEFORE UPDATE ON public.weekly_titles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.weekly_titles IS 'Weekly title spotlight assignments for admin curation';
COMMENT ON COLUMN public.weekly_titles.week_of IS 'Monday date representing the start of the week';
COMMENT ON COLUMN public.weekly_titles.title_id IS 'Reference to the selected title from titles table';
COMMENT ON COLUMN public.weekly_titles.input_logline IS 'Editorial logline input (syncs to titles.tagline)';
COMMENT ON COLUMN public.weekly_titles.input_comparables IS 'Editorial comparables input (syncs to titles.comps)';
COMMENT ON COLUMN public.weekly_titles.input_characters IS 'Editorial characters input (syncs to titles.character_details)';
COMMENT ON COLUMN public.weekly_titles.input_synopsis IS 'Editorial synopsis input (syncs to titles.synopsis)';
COMMENT ON COLUMN public.weekly_titles.input_selling_points IS 'Editorial selling points input (syncs to titles.selling_points)';
COMMENT ON COLUMN public.weekly_titles.created_by IS 'Admin email who created the weekly title entry';
COMMENT ON COLUMN public.titles.selling_points IS 'Key selling points for the title';
