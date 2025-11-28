-- Migration: Create title_platforms table for multi-platform support
-- Date: 2025-10-24
-- Status: IN_PROGRESS
-- Description: Store multiple platform URLs and metrics per title (Naver, Kakao, Lezhin, etc.)
--
-- This migration creates a new table for storing platform-specific data without
-- affecting existing dashboard functionality. All fields are new additions.

BEGIN;

-- Create title_platforms table
CREATE TABLE IF NOT EXISTS public.title_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES public.titles(title_id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL CHECK (platform_name IN (
    'naver', 'kakao', 'lezhin', 'ridibooks', 'toomics', 'bomtoon',
    'ktoon', 'kakaopage', 'munpia', 'joara', 'novelpia', 'other'
  )),
  platform_url TEXT NOT NULL,
  views BIGINT DEFAULT 0,
  subscribers BIGINT DEFAULT 0,
  other_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT title_platforms_title_id_platform_name_unique UNIQUE(title_id, platform_name)
);

-- Create indexes for performance
CREATE INDEX idx_title_platforms_title_id ON public.title_platforms(title_id);
CREATE INDEX idx_title_platforms_platform_name ON public.title_platforms(platform_name);

-- Enable Row Level Security
ALTER TABLE public.title_platforms ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Creators can manage platforms for their titles
CREATE POLICY "Creators manage platforms for their titles"
ON public.title_platforms FOR ALL
TO authenticated
USING (
  title_id IN (SELECT title_id FROM public.titles WHERE creator_id = auth.uid())
)
WITH CHECK (
  title_id IN (SELECT title_id FROM public.titles WHERE creator_id = auth.uid())
);

-- RLS Policy: All authenticated users can view platforms
CREATE POLICY "All users can view platforms"
ON public.title_platforms FOR SELECT
TO authenticated
USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_title_platforms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_title_platforms_updated_at
    BEFORE UPDATE ON public.title_platforms
    FOR EACH ROW
    EXECUTE FUNCTION update_title_platforms_updated_at();

-- Add table comment
COMMENT ON TABLE public.title_platforms IS 'Multiple platform URLs and metrics per title for questionnaire data';
COMMENT ON COLUMN public.title_platforms.platform_name IS 'Platform identifier (naver, kakao, etc.)';
COMMENT ON COLUMN public.title_platforms.other_metrics IS 'JSONB for additional platform-specific metrics';

COMMIT;
