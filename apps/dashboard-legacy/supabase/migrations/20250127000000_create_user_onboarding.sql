-- Migration: Create user_onboarding table for tracking onboarding progress
-- Purpose: Track buyer onboarding completion, progress, and drop-off points for PRD 2.1
-- Created: 2025-01-27

-- Create user_onboarding table
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_started_at TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  current_step INTEGER DEFAULT 0,
  skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user
  CONSTRAINT unique_user_onboarding UNIQUE(user_id)
);

-- Create index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON public.user_onboarding(user_id);

-- Create index for querying by completion status
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON public.user_onboarding(onboarding_completed);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_onboarding_email ON public.user_onboarding(user_email);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onboarding_updated_at();

-- Enable Row Level Security
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own onboarding data
CREATE POLICY "Users can view own onboarding"
  ON public.user_onboarding
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own onboarding data
CREATE POLICY "Users can insert own onboarding"
  ON public.user_onboarding
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own onboarding data
CREATE POLICY "Users can update own onboarding"
  ON public.user_onboarding
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_onboarding TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_onboarding TO anon;

-- Add comment for documentation
COMMENT ON TABLE public.user_onboarding IS 'Tracks user onboarding progress for PRD 2.1 engagement optimization';
COMMENT ON COLUMN public.user_onboarding.current_step IS 'Current onboarding step (0-4). 0 = not started, 1-4 = step number';
COMMENT ON COLUMN public.user_onboarding.skipped IS 'Whether user skipped onboarding completely';