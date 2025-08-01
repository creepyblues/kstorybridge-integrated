-- ============================================
-- SUPABASE POLICY FIX V2 FOR ADMIN APP
-- ============================================
-- This addresses the remaining 401 errors by ensuring proper RLS policies
-- for anonymous and authenticated users on admin and titles tables

-- Step 1: Check current RLS status and policies
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('admin', 'titles');

-- Step 2: Drop ALL existing restrictive policies on admin table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'admin'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.admin';
    END LOOP;
END
$$;

-- Step 3: Drop ALL existing restrictive policies on titles table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'titles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.titles';
    END LOOP;
END
$$;

-- Step 4: Create completely permissive policies for admin table
CREATE POLICY "admin_select_all" 
  ON public.admin 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Step 5: Create completely permissive policies for titles table
CREATE POLICY "titles_select_all" 
  ON public.titles 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Step 6: Ensure RLS is enabled but with permissive policies
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;

-- Step 7: Grant explicit permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.admin TO anon, authenticated;
GRANT SELECT ON public.titles TO anon, authenticated;

-- Step 8: Verify the policies are working with direct queries
-- These should work without 401 errors:
SELECT 'Testing admin table access:' as test;
SELECT COUNT(*) as admin_count FROM public.admin;

SELECT 'Testing titles table access:' as test;
SELECT COUNT(*) as titles_count FROM public.titles;

-- Step 9: Test the specific queries the admin app makes
SELECT 'Testing specific admin app queries:' as test;

-- This is what the admin app does for connectivity test
SELECT title_id FROM public.titles LIMIT 1;
SELECT email FROM public.admin LIMIT 1;

-- This is what the admin app does for email verification
SELECT * FROM public.admin WHERE email = 'test@example.com';

-- Step 10: Display current policies for verification
SELECT 'Current admin table policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admin';

SELECT 'Current titles table policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'titles';

-- Step 11: Additional debugging - check table permissions
SELECT 'Table permissions for anon role:' as info;
SELECT 
    schemaname,
    tablename,
    hasselect,
    hasinsert,
    hasupdate,
    hasdelete
FROM pg_tables t
LEFT JOIN information_schema.table_privileges tp ON (
    tp.table_schema = t.schemaname AND 
    tp.table_name = t.tablename AND 
    tp.grantee = 'anon'
)
WHERE t.schemaname = 'public' AND t.tablename IN ('admin', 'titles');