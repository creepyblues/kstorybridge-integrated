-- Create request table for premium feature requests
CREATE TABLE public.request (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_id UUID NOT NULL REFERENCES public.titles(title_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, title_id, type)
);

-- Enable Row Level Security
ALTER TABLE public.request ENABLE ROW LEVEL SECURITY;

-- Create policies for request table
CREATE POLICY "Users can view their own requests" 
  ON public.request 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requests" 
  ON public.request 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests" 
  ON public.request 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own requests" 
  ON public.request 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_request_updated_at
  BEFORE UPDATE ON public.request
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();