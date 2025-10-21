-- Migration: Add welcome video tracking to user_onboarding table
-- Purpose: Track if user has seen the "How KStoryBridge Works" video on first login
-- Created: 2025-01-30
-- Status: SAFE - Additive only, no breaking changes

-- Add has_seen_welcome_video column to track video viewing
ALTER TABLE public.user_onboarding
ADD COLUMN IF NOT EXISTS has_seen_welcome_video BOOLEAN DEFAULT FALSE;

-- Create index for fast queries on video viewing status
CREATE INDEX IF NOT EXISTS idx_user_onboarding_welcome_video
ON public.user_onboarding(has_seen_welcome_video);

-- Add comment for documentation
COMMENT ON COLUMN public.user_onboarding.has_seen_welcome_video IS 'Tracks if user has seen the welcome video on first login';

-- Note: RLS policies already cover this column (users can update their own onboarding data)
-- No additional RLS policies needed
