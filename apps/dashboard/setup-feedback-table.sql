-- Run this SQL in your Supabase dashboard SQL editor to create the feedback_buyer table

-- Create feedback_buyer table for user feedback messages
CREATE TABLE IF NOT EXISTS public.feedback_buyer (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_buyer_user_id ON public.feedback_buyer(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_buyer_created_at ON public.feedback_buyer(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.feedback_buyer ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.feedback_buyer
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create policy to allow users to view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.feedback_buyer
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow anonymous inserts for testing (temporary)
CREATE POLICY "Allow anonymous feedback for testing"
ON public.feedback_buyer
FOR INSERT
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON public.feedback_buyer TO anon;
GRANT SELECT, INSERT ON public.feedback_buyer TO authenticated;