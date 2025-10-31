-- Fix OAuth signup RLS policies for user_buyers and user_ipowners
-- The issue: OAuth signup fails because RLS policies are too restrictive
-- Solution: Allow authenticated users to insert their own profiles during signup

-- First, drop the existing restrictive insert policies
DROP POLICY IF EXISTS "Buyers can insert their own profile" ON public.user_buyers;
DROP POLICY IF EXISTS "IP owners can insert their own profile" ON public.user_ipowners;

-- Create more permissive insert policies for OAuth signup
-- These policies allow authenticated users to insert their own profile during signup
CREATE POLICY "Authenticated users can insert buyer profile" 
  ON public.user_buyers 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can insert IP owner profile" 
  ON public.user_ipowners 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also add a policy to allow upsert operations (which SignupForm uses)
CREATE POLICY "Authenticated users can upsert buyer profile" 
  ON public.user_buyers 
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can upsert IP owner profile" 
  ON public.user_ipowners 
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add helpful comments
COMMENT ON POLICY "Authenticated users can insert buyer profile" ON public.user_buyers 
IS 'Allows OAuth and email signup to create buyer profiles';

COMMENT ON POLICY "Authenticated users can insert IP owner profile" ON public.user_ipowners 
IS 'Allows OAuth and email signup to create IP owner profiles';