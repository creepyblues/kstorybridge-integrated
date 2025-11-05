-- Fix Chat Tables INSERT RLS Policies for OAuth Compatibility
--
-- ISSUE: Chat session/message creation failing with "new row violates row-level security policy"
--        during OAuth authentication flows in dashboard-v2
--
-- ROOT CAUSE: INSERT policies only check auth.uid(), which is temporarily NULL
--             during OAuth session establishment, causing checks to fail
--
-- AFFECTED TABLES:
--   - chat_sessions: Session creation fails
--   - chat_messages: Message creation would fail after session exists
--   - chat_interactions: Interaction tracking would fail
--
-- SOLUTION: Add JWT claims fallback to all INSERT policies
--           (matches pattern from user_buyers fix in 20251103000001)
--
-- TESTING: Verify OAuth signup → chat session creation works
--
-- STATUS: COMPLETED
-- DEPLOYED: 2025-11-04 (Production)

-- =============================================================================
-- 1. Fix chat_sessions INSERT Policy
-- =============================================================================

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own chat sessions" ON public.chat_sessions;

-- Create OAuth-compatible INSERT policy with JWT fallback
CREATE POLICY "OAuth and email-friendly chat session insert"
  ON public.chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Primary: Standard auth.uid() check (works for email signup & established sessions)
    auth.uid() = user_id OR
    -- Fallback: JWT claims check (critical for OAuth timing when auth.uid() is NULL)
    (auth.jwt() ->> 'aud' = 'authenticated' AND
     current_setting('request.jwt.claim.sub', true) = user_id::text)
  );

-- Add explanatory comment
COMMENT ON POLICY "OAuth and email-friendly chat session insert" ON public.chat_sessions
IS 'Allows authenticated users to insert their own chat sessions during email/OAuth flows.
Uses JWT claims as fallback when auth.uid() is temporarily null during OAuth session establishment.
Matches user_buyers INSERT policy pattern from 20251103000001_restore_user_buyers_oauth_insert_rls.sql.';

-- =============================================================================
-- 2. Fix chat_messages INSERT Policy
-- =============================================================================

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON public.chat_messages;

-- Create OAuth-compatible INSERT policy with JWT fallback
CREATE POLICY "OAuth and email-friendly chat message insert"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Primary: Standard auth.uid() check
    auth.uid() = user_id OR
    -- Fallback: JWT claims check (OAuth compatibility)
    (auth.jwt() ->> 'aud' = 'authenticated' AND
     current_setting('request.jwt.claim.sub', true) = user_id::text)
  );

-- Add explanatory comment
COMMENT ON POLICY "OAuth and email-friendly chat message insert" ON public.chat_messages
IS 'Allows authenticated users to insert their own chat messages during email/OAuth flows.
Uses JWT claims as fallback when auth.uid() is temporarily null during OAuth session establishment.';

-- =============================================================================
-- 3. Fix chat_interactions INSERT Policy
-- =============================================================================

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own chat interactions" ON public.chat_interactions;

-- Create OAuth-compatible INSERT policy with JWT fallback
CREATE POLICY "OAuth and email-friendly chat interaction insert"
  ON public.chat_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Primary: Standard auth.uid() check
    auth.uid() = user_id OR
    -- Fallback: JWT claims check (OAuth compatibility)
    (auth.jwt() ->> 'aud' = 'authenticated' AND
     current_setting('request.jwt.claim.sub', true) = user_id::text)
  );

-- Add explanatory comment
COMMENT ON POLICY "OAuth and email-friendly chat interaction insert" ON public.chat_interactions
IS 'Allows authenticated users to insert their own chat interactions during email/OAuth flows.
Uses JWT claims as fallback when auth.uid() is temporarily null during OAuth session establishment.';

-- =============================================================================
-- Verification Queries (for testing after deployment)
-- =============================================================================

-- Verify policies were created correctly
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual::text as using_clause,
--   with_check::text as with_check_clause
-- FROM pg_policies
-- WHERE tablename IN ('chat_sessions', 'chat_messages', 'chat_interactions')
--   AND cmd = 'INSERT'
-- ORDER BY tablename, policyname;

-- Verify comments were added
-- SELECT
--   c.relname AS table_name,
--   p.polname AS policy_name,
--   pg_catalog.obj_description(p.oid, 'pg_policy') AS policy_description
-- FROM pg_policy p
-- JOIN pg_class c ON p.polrelid = c.oid
-- WHERE c.relname IN ('chat_sessions', 'chat_messages', 'chat_interactions')
--   AND p.polcmd = 'a'  -- INSERT command
-- ORDER BY c.relname, p.polname;
