-- Migration: Trial Sessions Tracking
-- Purpose: Track trial users and link them to signups for conversion analytics
-- Date: 2026-01-08

-- =============================================================================
-- 1. Create trial_sessions table
-- =============================================================================

CREATE TABLE public.trial_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,

  -- Conversion tracking
  converted boolean DEFAULT false,
  converted_at timestamptz,
  user_id uuid REFERENCES auth.users(id),
  user_email text,

  -- Activity summary
  tools_used text[] DEFAULT '{}',
  total_searches integer DEFAULT 0,
  comps_searches integer DEFAULT 0,
  mandate_searches integer DEFAULT 0,
  chat_messages integer DEFAULT 0,
  titles_viewed integer DEFAULT 0,

  -- Last queries (for context)
  last_comps_query text[],
  last_mandate_query text,
  last_chat_query text,

  -- Timestamps
  first_visit_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT trial_sessions_pkey PRIMARY KEY (id)
);

-- Indexes for common queries
CREATE INDEX idx_trial_sessions_session_id ON public.trial_sessions(session_id);
CREATE INDEX idx_trial_sessions_converted ON public.trial_sessions(converted);
CREATE INDEX idx_trial_sessions_user_id ON public.trial_sessions(user_id);
CREATE INDEX idx_trial_sessions_created_at ON public.trial_sessions(created_at DESC);

-- =============================================================================
-- 2. Add trial tracking columns to user_buyers
-- =============================================================================

ALTER TABLE public.user_buyers
ADD COLUMN IF NOT EXISTS trial_session_id text,
ADD COLUMN IF NOT EXISTS came_from_trial boolean DEFAULT false;

-- =============================================================================
-- 3. RLS Policies for trial_sessions
-- =============================================================================

ALTER TABLE public.trial_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert/update their own trial sessions (by session_id)
CREATE POLICY "Anyone can create trial sessions"
  ON public.trial_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update trial sessions by session_id"
  ON public.trial_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role has full access to trial_sessions"
  ON public.trial_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read their own trial sessions
CREATE POLICY "Users can read their own trial sessions"
  ON public.trial_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- =============================================================================
-- 4. Comments for documentation
-- =============================================================================

COMMENT ON TABLE public.trial_sessions IS 'Tracks anonymous trial users and their activity for conversion analytics';
COMMENT ON COLUMN public.trial_sessions.session_id IS 'Unique UUID generated client-side and stored in localStorage';
COMMENT ON COLUMN public.trial_sessions.converted IS 'True when trial user signs up';
COMMENT ON COLUMN public.trial_sessions.tools_used IS 'Array of tools used: comps, mandates, chat';
COMMENT ON COLUMN public.trial_sessions.total_searches IS 'Total number of searches across all tools';
