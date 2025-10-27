-- Fix user_buyers INSERT policy for profile creation
-- Date: 2025-09-19 02:50:00
-- Issue: Profile creation hanging due to missing/incorrect RLS INSERT policy

-- Enable RLS if not already enabled
ALTER TABLE public.user_buyers ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can insert buyer profile" ON public.user_buyers;
DROP POLICY IF EXISTS "Users can insert own buyer profile" ON public.user_buyers;
DROP POLICY IF EXISTS "Buyers can insert their own profile" ON public.user_buyers;

-- Create comprehensive INSERT policy
CREATE POLICY "Users can insert own buyer profile"
  ON public.user_buyers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure UPDATE policy exists for profile updates
DROP POLICY IF EXISTS "Users can update own buyer profile" ON public.user_buyers;
CREATE POLICY "Users can update own buyer profile"
  ON public.user_buyers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add helpful comments
COMMENT ON POLICY "Users can insert own buyer profile" ON public.user_buyers
IS 'Allows authenticated users to create their own buyer profile during signup';

COMMENT ON POLICY "Users can update own buyer profile" ON public.user_buyers
IS 'Allows authenticated users to update their own buyer profile';