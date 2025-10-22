-- Fix OAuth RLS Timing Issues
-- Date: 2025-01-30
-- Issue: OAuth profile creation fails due to RLS timing when auth.uid() is temporarily null
-- Solution: Enhanced RLS policies that use JWT claims as fallback during OAuth session establishment

-- Enhanced RLS policy for user_buyers to handle OAuth timing
-- This policy allows profile creation when either:
-- 1. auth.uid() is available (normal case)
-- 2. JWT claims show authenticated user during OAuth session establishment (fallback case)
CREATE POLICY "OAuth-friendly buyer profile creation"
  ON public.user_buyers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id OR
    (auth.jwt() ->> 'aud' = 'authenticated' AND
     current_setting('request.jwt.claim.sub', true) = id::text)
  );

-- Enhanced RLS policy for user_creators to handle OAuth timing
-- Same approach as buyer policy - use JWT claims when auth.uid() is temporarily unavailable
CREATE POLICY "OAuth-friendly creator profile creation"
  ON public.user_creators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id OR
    (auth.jwt() ->> 'aud' = 'authenticated' AND
     current_setting('request.jwt.claim.sub', true) = id::text)
  );

-- Add helpful comments explaining the OAuth timing solution
COMMENT ON POLICY "OAuth-friendly buyer profile creation" ON public.user_buyers
IS 'Allows OAuth profile creation during session establishment when auth.uid() may be temporarily null. Uses JWT claims as fallback.';

COMMENT ON POLICY "OAuth-friendly creator profile creation" ON public.user_creators
IS 'Allows OAuth profile creation during session establishment when auth.uid() may be temporarily null. Uses JWT claims as fallback.';

-- Note: These policies work alongside existing policies to provide OAuth timing resilience
-- without compromising security. The JWT claim validation ensures only authenticated
-- users can create profiles with their own user ID.