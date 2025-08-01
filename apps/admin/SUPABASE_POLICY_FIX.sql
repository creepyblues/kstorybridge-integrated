-- ============================================
-- COMPREHENSIVE SUPABASE POLICY FIX FOR ADMIN APP
-- ============================================
-- This fixes the 401 Unauthorized errors in the admin app
-- by allowing anonymous users to check admin table and basic connectivity

-- Step 1: Fix Admin Table Policies
-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Admins can view admin records" ON public.admin;
DROP POLICY IF EXISTS "Authenticated users can view admin records" ON public.admin;
DROP POLICY IF EXISTS "Users can view their own admin record" ON public.admin;

-- Create a permissive policy for admin email verification
-- This allows the app to check if an email has admin access before authentication
CREATE POLICY "Allow admin status verification" 
  ON public.admin 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Step 2: Check and Fix Titles Table Policies
-- The admin app needs to test connectivity by querying titles table
-- Check current policies on titles table
DO $$
BEGIN
  -- Drop restrictive policies that might block anonymous access for connectivity testing
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'titles' 
    AND policyname = 'Enable read access for all users'
  ) THEN
    DROP POLICY "Enable read access for all users" ON public.titles;
  END IF;
END
$$;

-- Create a basic read policy for titles (needed for connectivity testing)
CREATE POLICY "Allow basic titles access" 
  ON public.titles 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Step 3: Verify RLS is enabled but with proper policies
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;

-- Step 4: Grant necessary permissions
-- Ensure anonymous role can read from these tables
GRANT SELECT ON public.admin TO anon;
GRANT SELECT ON public.titles TO anon;

-- Step 5: Create a test function for connectivity (optional)
CREATE OR REPLACE FUNCTION public.test_admin_connectivity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'admin_table_accessible', EXISTS(SELECT 1 FROM public.admin LIMIT 1),
    'titles_table_accessible', EXISTS(SELECT 1 FROM public.titles LIMIT 1),
    'timestamp', NOW()
  );
END;
$$;

-- Grant execute permission on the test function
GRANT EXECUTE ON FUNCTION public.test_admin_connectivity() TO anon, authenticated;

-- Step 6: Verify the setup
-- You can run this to test:
-- SELECT public.test_admin_connectivity();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the policies are working:

-- 1. Check admin table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admin';

-- 2. Check titles table policies  
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'titles';

-- 3. Test admin table access
SELECT email, full_name, active FROM public.admin LIMIT 5;

-- 4. Test connectivity function
SELECT public.test_admin_connectivity();