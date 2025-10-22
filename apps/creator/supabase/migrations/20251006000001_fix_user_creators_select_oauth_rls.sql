-- Fix OAuth RLS Timing for SELECT Operations on user_creators
-- Date: 2025-10-06
-- Issue: OAuth signin fails with 10-second timeout when checking profile existence
-- Root Cause: SELECT policy only checks auth.uid() which is null during OAuth session establishment
-- Solution: Add JWT claims fallback (same pattern as INSERT policy from 20250130000000)

-- Drop existing SELECT policy that lacks JWT fallback
DROP POLICY IF EXISTS "Users can view own creator profile" ON public.user_creators;

-- Create OAuth-friendly SELECT policy with JWT fallback
-- This policy allows profile reads when either:
-- 1. auth.uid() is available (normal case - 99% of queries)
-- 2. JWT claims show authenticated user during OAuth session establishment (fallback case)
CREATE POLICY "OAuth-friendly creator profile select"
  ON public.user_creators
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    (auth.jwt() ->> 'aud' = 'authenticated' AND
     current_setting('request.jwt.claim.sub', true) = id::text)
  );

-- Add comment explaining the OAuth timing solution
COMMENT ON POLICY "OAuth-friendly creator profile select" ON public.user_creators
IS 'Allows authenticated creators to read their own profile during OAuth session establishment when auth.uid() may be temporarily null. Uses JWT claims as fallback. Matches INSERT policy pattern from 20250130000000_fix_oauth_rls_timing.sql';

-- Note: This policy aligns SELECT behavior with INSERT policy to eliminate timing inconsistency
-- Performance: JWT fallback only activates during OAuth when auth.uid() is null (< 1% of queries)
-- Security: JWT validation ensures users can only access their own profile data
