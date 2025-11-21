-- Migration: Fix Comps Navigator RLS Policies
-- Description: Fix RLS policies to use auth.uid() instead of referencing users table
-- Status: IN_PROGRESS
-- Created: 2025-11-20
-- Issue: RLS policies were causing "permission denied for table users" error

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own searches" ON comp_searches;
DROP POLICY IF EXISTS "Users can insert own searches" ON comp_searches;
DROP POLICY IF EXISTS "Users can update own searches" ON comp_searches;
DROP POLICY IF EXISTS "Users can delete own searches" ON comp_searches;

-- Recreate policies with correct auth.uid() usage
-- Note: We use user_email field to match since that's what we're storing

-- Policy: Users can view their own searches based on email
CREATE POLICY "Users can view own searches"
  ON comp_searches
  FOR SELECT
  USING (
    user_email = auth.email()
  );

-- Policy: Users can insert their own searches
CREATE POLICY "Users can insert own searches"
  ON comp_searches
  FOR INSERT
  WITH CHECK (
    user_email = auth.email()
  );

-- Policy: Users can update their own searches (for bookmarking)
CREATE POLICY "Users can update own searches"
  ON comp_searches
  FOR UPDATE
  USING (
    user_email = auth.email()
  );

-- Policy: Users can delete their own searches
CREATE POLICY "Users can delete own searches"
  ON comp_searches
  FOR DELETE
  USING (
    user_email = auth.email()
  );

-- Verify RLS is still enabled
ALTER TABLE comp_searches ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON comp_searches TO authenticated;

-- Comments
COMMENT ON POLICY "Users can view own searches" ON comp_searches IS 'Users can only view searches where user_email matches their auth email';
COMMENT ON POLICY "Users can insert own searches" ON comp_searches IS 'Users can only insert searches with their own email';
COMMENT ON POLICY "Users can update own searches" ON comp_searches IS 'Users can only update their own searches (for bookmarking)';
COMMENT ON POLICY "Users can delete own searches" ON comp_searches IS 'Users can only delete their own searches';
