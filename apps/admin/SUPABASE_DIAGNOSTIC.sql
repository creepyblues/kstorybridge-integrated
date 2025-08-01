-- ============================================
-- DIAGNOSTIC QUERIES FOR ADMIN APP 401 ERRORS
-- ============================================
-- Run these to understand why the admin app is getting 401 errors

-- 1. Check if tables exist and are accessible
SELECT 'Table existence check:' as test;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin', 'titles');

-- 2. Check RLS status
SELECT 'RLS Status:' as test;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('admin', 'titles');

-- 3. Check current policies
SELECT 'Current Policies:' as test;
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('admin', 'titles')
ORDER BY tablename, policyname;

-- 4. Check role permissions
SELECT 'Anonymous role permissions:' as test;
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('admin', 'titles')
AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY table_name, grantee;

-- 5. Test direct queries as they would be executed by the app
SELECT 'Direct query tests:' as test;

-- Test 1: Basic count (should work)
SELECT COUNT(*) as admin_records FROM public.admin;
SELECT COUNT(*) as title_records FROM public.titles;

-- Test 2: Specific columns (what the admin app queries)
SELECT email FROM public.admin LIMIT 1;
SELECT title_id FROM public.titles LIMIT 1;

-- Test 3: Filtered queries (what admin auth does)
SELECT * FROM public.admin 
WHERE email = 'nonexistent@test.com' 
AND active = true;

-- 6. Check if there are any triggers or additional constraints
SELECT 'Triggers and constraints:' as test;
SELECT 
    trigger_name,
    table_name,
    trigger_schema
FROM information_schema.triggers 
WHERE table_schema = 'public' 
AND table_name IN ('admin', 'titles');

-- 7. Show exact policy definitions
SELECT 'Detailed policy definitions:' as test;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('admin', 'titles');