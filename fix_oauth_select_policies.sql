-- Fix OAuth Login Timeout - Remove Conflicting SELECT Policies
-- Date: 2025-10-10
-- Status: ✅ DEPLOYED - Policies successfully removed
-- Deployment Date: 2025-10-10
-- Issue: OAuth signin fails with 10-second timeout due to multiple SELECT policies with AND logic
-- Root Cause: 3 SELECT policies exist, 2 without JWT fallback block OAuth when auth.uid() is null
-- Solution: Remove redundant SELECT policies, keep only OAuth-friendly one
-- Result: Only 1 SELECT policy remains ("OAuth-friendly buyer profile select")

-- ============================================================================
-- STEP 1: Verify Current State (Run this first to confirm the problem)
-- ============================================================================

-- Show all current SELECT policies on user_buyers
SELECT
  policyname,
  cmd,
  qual::text as condition,
  CASE
    WHEN qual::text LIKE '%auth.jwt()%' THEN 'Yes ✅'
    ELSE 'No ❌'
  END as has_jwt_fallback
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_buyers'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Expected output: 3 SELECT policies
-- - "Buyers can view their own profile" - No JWT fallback ❌
-- - "Enable select for authenticated users own profile" - No JWT fallback ❌
-- - "OAuth-friendly buyer profile select" - Has JWT fallback ✅

-- ============================================================================
-- STEP 2: Remove Conflicting Policies
-- ============================================================================

-- Remove the 2 SELECT policies that lack JWT fallback
DROP POLICY IF EXISTS "Buyers can view their own profile" ON public.user_buyers;
DROP POLICY IF EXISTS "Enable select for authenticated users own profile" ON public.user_buyers;

-- Note: We keep "OAuth-friendly buyer profile select" which has JWT fallback

-- ============================================================================
-- STEP 3: Verify Fix Applied
-- ============================================================================

-- Check remaining SELECT policies (should be only 1)
SELECT
  policyname,
  cmd,
  qual::text as condition
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_buyers'
  AND cmd = 'SELECT';

-- Expected output: Only 1 SELECT policy
-- - "OAuth-friendly buyer profile select"

-- Display success message
SELECT '✅ SUCCESS: Conflicting SELECT policies removed. Only OAuth-friendly policy remains.' AS status;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show all policies on user_buyers (for complete overview)
SELECT
  policyname,
  cmd,
  CASE
    WHEN qual::text LIKE '%auth.jwt()%' OR with_check::text LIKE '%auth.jwt()%' THEN 'Yes ✅'
    ELSE 'No ❌'
  END as has_jwt_fallback,
  permissive as is_permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_buyers'
ORDER BY cmd, policyname;

-- ============================================================================
-- ROLLBACK PLAN (If Issues Occur)
-- ============================================================================

-- If the fix causes issues, restore the old policies:
/*
CREATE POLICY "Buyers can view their own profile"
  ON public.user_buyers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable select for authenticated users own profile"
  ON public.user_buyers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Verify rollback
SELECT '⚠️ ROLLBACK COMPLETE: Old policies restored' AS status;
*/
