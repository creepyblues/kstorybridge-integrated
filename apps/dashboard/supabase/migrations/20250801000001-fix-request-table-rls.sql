-- Fix RLS policies for request table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own requests" ON public.request;
DROP POLICY IF EXISTS "Users can insert their own requests" ON public.request;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.request;
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.request;

-- Create more permissive policies for debugging
CREATE POLICY "Users can view their own requests" 
  ON public.request 
  FOR SELECT 
  USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own requests" 
  ON public.request 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own requests" 
  ON public.request 
  FOR UPDATE 
  USING (auth.uid() = user_id::uuid)
  WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can delete their own requests" 
  ON public.request 
  FOR DELETE 
  USING (auth.uid() = user_id::uuid);

-- Alternative: Create a temporary permissive policy for testing
-- Uncomment the following lines if the above doesn't work
-- DROP POLICY IF EXISTS "Allow authenticated users to insert requests" ON public.request;
-- CREATE POLICY "Allow authenticated users to insert requests" 
--   ON public.request 
--   FOR INSERT 
--   WITH CHECK (auth.uid() IS NOT NULL);