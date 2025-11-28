-- FINAL FIX: RLS Policies for user_creators table
-- 
-- This script will:
-- 1. Drop any existing policies that might be incorrectly configured
-- 2. Recreate the correct policies for OAuth creator signup
-- 3. Verify the policies are working

-- First, check what policies currently exist
\echo 'Current policies on user_creators:'
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_creators' 
ORDER BY policyname;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Authenticated users can insert creator profile" ON public.user_creators;
DROP POLICY IF EXISTS "Authenticated users can upsert creator profile" ON public.user_creators;
DROP POLICY IF EXISTS "Authenticated users can update creator profile" ON public.user_creators;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_creators;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_creators;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_creators;

-- Ensure RLS is enabled
ALTER TABLE public.user_creators ENABLE ROW LEVEL SECURITY;

-- Create the correct INSERT policy for OAuth creator signups
CREATE POLICY "Authenticated users can insert creator profile" 
  ON public.user_creators 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create UPDATE policy for upsert operations (used by atomicProfileCreator)
CREATE POLICY "Authenticated users can update creator profile" 
  ON public.user_creators 
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create SELECT policy so users can read their own profiles
CREATE POLICY "Users can view their own creator profile" 
  ON public.user_creators 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Add helpful comments
COMMENT ON POLICY "Authenticated users can insert creator profile" ON public.user_creators 
IS 'CRITICAL: Allows OAuth creators to insert their profiles during signup - fixes error 42501';

COMMENT ON POLICY "Authenticated users can update creator profile" ON public.user_creators 
IS 'Allows upsert operations used by atomicProfileCreator - fixes OAuth completion';

COMMENT ON POLICY "Users can view their own creator profile" ON public.user_creators 
IS 'Allows users to read their own profile data after creation';

-- Verification: Check that policies were created correctly
\echo 'NEW policies on user_creators:'
SELECT 
  policyname, 
  cmd, 
  CASE WHEN cmd = 'INSERT' THEN with_check ELSE qual END as condition
FROM pg_policies 
WHERE tablename = 'user_creators' 
ORDER BY policyname;

-- Final verification that RLS is properly configured
\echo 'RLS status for user_creators:'
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables 
WHERE tablename = 'user_creators';