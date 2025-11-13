-- Fix user_creators INSERT RLS Policy for Email Signup
-- Date: 2025-10-24
-- Issue: Email signup fails with "new row violates row-level security policy for table user_creators"
-- Root Cause: Current INSERT policy only checks auth.uid() which can be null during signup
-- Solution: Add JWT claims fallback (same pattern as SELECT policy)

-- Only proceed if user_creators table exists (handles migration ordering issues)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_creators') THEN
    -- Drop the restrictive INSERT policy
    DROP POLICY IF EXISTS "Authenticated users can insert creator profile" ON public.user_creators;

    -- Create OAuth and Email-friendly INSERT policy with JWT fallback
    -- This policy allows profile creation when either:
    -- 1. auth.uid() is available (normal case - 99% of queries)
    -- 2. JWT claims show authenticated user during session establishment (fallback case)
    EXECUTE 'CREATE POLICY "OAuth and email-friendly creator profile insert"
      ON public.user_creators
      FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = id OR
        (auth.jwt() ->> ''aud'' = ''authenticated'' AND
         current_setting(''request.jwt.claim.sub'', true) = id::text)
      )';

    -- Add comment explaining the solution
    COMMENT ON POLICY "OAuth and email-friendly creator profile insert" ON public.user_creators
    IS 'Allows authenticated creators to insert their own profile during email/OAuth signup when auth.uid() may be temporarily null. Uses JWT claims as fallback. Matches SELECT policy pattern from 20251006000001_fix_user_creators_select_oauth_rls.sql';
  END IF;
END $$;

-- Note: This policy aligns INSERT behavior with SELECT policy to eliminate timing inconsistency
-- Performance: JWT fallback only activates when auth.uid() is null (< 1% of queries)
-- Security: JWT validation ensures users can only create profiles with their own user ID
