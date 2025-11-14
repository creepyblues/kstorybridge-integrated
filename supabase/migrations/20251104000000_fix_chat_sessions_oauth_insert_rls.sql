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
-- NOTE: Tables only exist in dashboard app, migration skips if not present

-- =============================================================================
-- 1. Fix chat_sessions INSERT Policy (conditional - skip if table doesn't exist)
-- =============================================================================

DO $$
BEGIN
  -- Only proceed if chat_sessions table exists
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'chat_sessions'
  ) THEN
    -- Drop the existing restrictive INSERT policy
    DROP POLICY IF EXISTS "Users can insert their own chat sessions" ON public.chat_sessions;

    -- Create OAuth-compatible INSERT policy with JWT fallback
    EXECUTE format('
      CREATE POLICY "OAuth and email-friendly chat session insert"
        ON public.chat_sessions
        FOR INSERT
        TO authenticated
        WITH CHECK (
          auth.uid() = user_id OR
          (auth.jwt() ->> ''aud'' = ''authenticated'' AND
           current_setting(''request.jwt.claim.sub'', true) = user_id::text)
        )
    ');

    -- Add explanatory comment
    COMMENT ON POLICY "OAuth and email-friendly chat session insert" ON public.chat_sessions
    IS 'Allows authenticated users to insert their own chat sessions during email/OAuth flows.
    Uses JWT claims as fallback when auth.uid() is temporarily null during OAuth session establishment.
    Matches user_buyers INSERT policy pattern from 20251103000001_restore_user_buyers_oauth_insert_rls.sql.';
  END IF;
END $$;

-- =============================================================================
-- 2. Fix chat_messages INSERT Policy (conditional)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'chat_messages'
  ) THEN
    -- Drop the existing restrictive INSERT policy
    DROP POLICY IF EXISTS "Users can insert their own chat messages" ON public.chat_messages;

    -- Create OAuth-compatible INSERT policy with JWT fallback
    EXECUTE format('
      CREATE POLICY "OAuth and email-friendly chat message insert"
        ON public.chat_messages
        FOR INSERT
        TO authenticated
        WITH CHECK (
          auth.uid() = user_id OR
          (auth.jwt() ->> ''aud'' = ''authenticated'' AND
           current_setting(''request.jwt.claim.sub'', true) = user_id::text)
        )
    ');

    -- Add explanatory comment
    COMMENT ON POLICY "OAuth and email-friendly chat message insert" ON public.chat_messages
    IS 'Allows authenticated users to insert their own chat messages during email/OAuth flows.
    Uses JWT claims as fallback when auth.uid() is temporarily null during OAuth session establishment.';
  END IF;
END $$;

-- =============================================================================
-- 3. Fix chat_interactions INSERT Policy (conditional)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'chat_interactions'
  ) THEN
    -- Drop the existing restrictive INSERT policy
    DROP POLICY IF EXISTS "Users can insert their own chat interactions" ON public.chat_interactions;

    -- Create OAuth-compatible INSERT policy with JWT fallback
    EXECUTE format('
      CREATE POLICY "OAuth and email-friendly chat interaction insert"
        ON public.chat_interactions
        FOR INSERT
        TO authenticated
        WITH CHECK (
          auth.uid() = user_id OR
          (auth.jwt() ->> ''aud'' = ''authenticated'' AND
           current_setting(''request.jwt.claim.sub'', true) = user_id::text)
        )
    ');

    -- Add explanatory comment
    COMMENT ON POLICY "OAuth and email-friendly chat interaction insert" ON public.chat_interactions
    IS 'Allows authenticated users to insert their own chat interactions during email/OAuth flows.
    Uses JWT claims as fallback when auth.uid() is temporarily null during OAuth session establishment.';
  END IF;
END $$;

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
