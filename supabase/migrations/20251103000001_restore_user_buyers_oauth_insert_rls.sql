-- Fix user_buyers INSERT RLS Policy for OAuth signup regression
--
-- ISSUE: OAuth signup failing with "new row violates row-level security policy"
--        and "foreign key constraint violation user_buyers_id_fkey"
--
-- ROOT CAUSE: Migration 20250919025000_fix_user_buyers_insert_policy.sql removed
--             JWT fallback from INSERT policy, breaking OAuth signup timing.
--             During OAuth, auth.uid() is temporarily NULL while session establishes,
--             requiring JWT claims as fallback authorization.
--
-- TIMELINE:
--   Jan 30, 2025: OAuth working (JWT fallback in place)
--   Sept 25, 2025: Stripe integration removed JWT fallback (regression)
--   Nov 3, 2025: Production failure detected
--
-- SOLUTION: Restore JWT fallback to INSERT policy (match SELECT policy pattern)
--           from 20251006000000_fix_user_buyers_select_oauth_rls.sql
--
-- STATUS: IN_PROGRESS
-- DEPLOYED: Pending

-- Drop the conflicting policy from Sept 25 migration
DROP POLICY IF EXISTS "Users can insert own buyer profile" ON public.user_buyers;

-- Create new policy with JWT fallback for OAuth timing compatibility
CREATE POLICY "OAuth and email-friendly buyer profile insert"
  ON public.user_buyers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Primary: Standard auth.uid() check (works for email signup)
    auth.uid() = id OR
    -- Fallback: JWT claims check (critical for OAuth signup timing)
    (auth.jwt() ->> 'aud' = 'authenticated' AND
     current_setting('request.jwt.claim.sub', true) = id::text)
  );

-- Add explanatory comment
COMMENT ON POLICY "OAuth and email-friendly buyer profile insert" ON public.user_buyers
IS 'Allows authenticated buyers to insert their own profile during email/OAuth signup.
Uses JWT claims as fallback when auth.uid() is temporarily null during OAuth session establishment.
Matches SELECT policy pattern from 20251006000000_fix_user_buyers_select_oauth_rls.sql.
Fixes regression introduced in 20250919025000_fix_user_buyers_insert_policy.sql.';

-- Verification query (for testing)
-- SELECT policyname, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'user_buyers' AND cmd = 'INSERT';
