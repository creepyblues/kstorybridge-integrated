-- Migration: Add mandate_searches table for mandate-based title recommendations
-- Created: 2025-11-21
-- Status: IN_PROGRESS
-- Description: Creates table to store user mandates and their search results with RLS policies

-- Create mandate_searches table
CREATE TABLE IF NOT EXISTS public.mandate_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    mandate_text TEXT NOT NULL CHECK (char_length(mandate_text) <= 1000),
    search_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    result_count INTEGER DEFAULT 0,
    avg_match_score NUMERIC(5,2)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mandate_searches_user_email
    ON public.mandate_searches(user_email);

CREATE INDEX IF NOT EXISTS idx_mandate_searches_created_at
    ON public.mandate_searches(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.mandate_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own mandates
CREATE POLICY "Users can view own mandate searches"
    ON public.mandate_searches
    FOR SELECT
    USING (auth.jwt() ->> 'email' = user_email);

-- RLS Policy: Users can insert their own mandates
CREATE POLICY "Users can insert own mandate searches"
    ON public.mandate_searches
    FOR INSERT
    WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- RLS Policy: Users can delete their own mandates
CREATE POLICY "Users can delete own mandate searches"
    ON public.mandate_searches
    FOR DELETE
    USING (auth.jwt() ->> 'email' = user_email);

-- Add comment
COMMENT ON TABLE public.mandate_searches IS
    'Stores user mandates and their AI-generated title recommendations using vector search';
