-- Fix RLS Policies for Titles Table
--
-- ISSUE: Admin app policy fixes dropped ALL policies on titles table and only created
-- SELECT policies, breaking INSERT/UPDATE operations for creators.
--
-- SOLUTION: Restore the proper RLS policies that allow creators to manage their own titles
-- while maintaining read access for all authenticated users.

-- Step 1: Drop the restrictive SELECT-only policy that was created by admin fixes
DROP POLICY IF EXISTS "titles_select_all" ON public.titles;

-- Step 2: Restore the original comprehensive policy for creators to manage their own titles
-- This allows INSERT, UPDATE, DELETE operations when auth.uid() = creator_id
CREATE POLICY "Creators can manage their own titles"
  ON public.titles
  FOR ALL
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Step 3: Restore the general SELECT policy for all authenticated users
-- This allows all authenticated users (buyers and creators) to view all titles
CREATE POLICY "All users can view titles"
  ON public.titles
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 4: Ensure RLS is enabled (should already be enabled, but ensuring consistency)
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;

-- Add helpful comments to explain the policies
COMMENT ON POLICY "Creators can manage their own titles" ON public.titles
IS 'Allows creators to INSERT, UPDATE, DELETE their own titles when auth.uid() = creator_id';

COMMENT ON POLICY "All users can view titles" ON public.titles
IS 'Allows all authenticated users to SELECT/view titles regardless of ownership';