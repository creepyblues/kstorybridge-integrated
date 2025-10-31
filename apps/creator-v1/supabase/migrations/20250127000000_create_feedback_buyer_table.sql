-- Create feedback_buyer table for user feedback messages
CREATE TABLE IF NOT EXISTS public.feedback_buyer (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_feedback_buyer_user_id ON public.feedback_buyer(user_id);

-- Create index for faster queries by created_at
CREATE INDEX IF NOT EXISTS idx_feedback_buyer_created_at ON public.feedback_buyer(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.feedback_buyer ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.feedback_buyer
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.feedback_buyer
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_feedback_buyer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_feedback_buyer_updated_at
    BEFORE UPDATE ON public.feedback_buyer
    FOR EACH ROW
    EXECUTE FUNCTION public.update_feedback_buyer_updated_at();

-- Grant permissions
GRANT SELECT, INSERT ON public.feedback_buyer TO authenticated;
GRANT USAGE ON SEQUENCE feedback_buyer_id_seq TO authenticated;