-- Fix Missing RLS Policies for user_creators Table
--
-- The issue: Migration 20250829150000-fix-oauth-signup-rls.sql created policies
-- for user_ipowners table, but that table was later renamed to user_creators.
-- The RLS policies were not migrated, leaving user_creators without INSERT/UPDATE policies.
--
-- This is why OAuth creator signups fail with RLS error 42501.

-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "Authenticated users can insert creator profile" ON public.user_creators;
DROP POLICY IF EXISTS "Authenticated users can upsert creator profile" ON public.user_creators;

-- Create INSERT policy for OAuth creator signups (missing piece!)
CREATE POLICY "Authenticated users can insert creator profile" 
  ON public.user_creators 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create UPDATE policy for upsert operations (used by atomicProfileCreator)
CREATE POLICY "Authenticated users can upsert creator profile" 
  ON public.user_creators 
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add helpful comments
COMMENT ON POLICY "Authenticated users can insert creator profile" ON public.user_creators 
IS 'CRITICAL: Allows OAuth creators to insert their profiles during signup - fixes missing policy from table rename';

COMMENT ON POLICY "Authenticated users can upsert creator profile" ON public.user_creators 
IS 'Allows upsert operations used by atomicProfileCreator - fixes missing policy from table rename';

-- Verification: These policies should now exist
-- You can verify with: SELECT * FROM pg_policies WHERE tablename = 'user_creators';