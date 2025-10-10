-- ⚠️ SUPERSEDED - DO NOT USE THIS FILE
-- This approach was INCORRECT - OAuth-friendly policy already existed!
--
-- CORRECT FIX: See fix_oauth_select_policies.sql
--
-- Original Approach (WRONG): Add OAuth-friendly SELECT policy
-- Actual Problem: OAuth-friendly policy existed but was blocked by 2 other policies
-- Correct Solution: Remove the 2 conflicting policies (not add another one)
--
-- Manual Application of RLS Policy Fix for OAuth Login Timeout (OBSOLETE)
-- Issue: OAuth signin fails with 10-second timeout when checking buyer profile existence
-- Original Solution: Add JWT claims fallback to SELECT policy
-- Actual Solution: Remove conflicting policies without JWT fallback
-- Date: 2025-10-10
-- Migration: 20251006000000_fix_user_buyers_select_oauth_rls.sql
-- Status: ❌ SUPERSEDED BY fix_oauth_select_policies.sql

-- Drop existing SELECT policies that might block OAuth
DROP POLICY IF EXISTS "Users can view own buyer profile" ON public.user_buyers;
DROP POLICY IF EXISTS "Buyers can view their own profile" ON public.user_buyers;
DROP POLICY IF EXISTS "user_buyers_select_policy" ON public.user_buyers;

-- Create OAuth-friendly SELECT policy with JWT fallback
-- This policy allows profile reads when either:
-- 1. auth.uid() is available (normal case - 99% of queries)
-- 2. JWT claims show authenticated user during OAuth session establishment (fallback case)
CREATE POLICY "OAuth-friendly buyer profile select"
  ON public.user_buyers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    (auth.jwt() ->> 'aud' = 'authenticated' AND
     current_setting('request.jwt.claim.sub', true) = id::text)
  );

-- Add comment explaining the OAuth timing solution
COMMENT ON POLICY "OAuth-friendly buyer profile select" ON public.user_buyers
IS 'Allows authenticated buyers to read their own profile during OAuth session establishment when auth.uid() may be temporarily null. Uses JWT claims as fallback. Matches INSERT policy pattern from 20250130000000_fix_oauth_rls_timing.sql';

-- Verify policy was created
SELECT 'SUCCESS: OAuth-friendly SELECT policy created for user_buyers' AS status;

-- Show current SELECT policies for verification
SELECT policyname, cmd, qual::text as condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_buyers'
AND cmd = 'SELECT';
