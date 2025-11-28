-- Check Database Triggers Status
-- Investigate why profile creation failed during OAuth signup

-- 1. Check if our consolidated trigger exists
SELECT 
    'Trigger existence check' as step,
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation,
    action_condition
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table = 'users'
  AND trigger_name LIKE '%profile%'
ORDER BY trigger_name;

-- 2. Check if trigger exists on auth.users table
SELECT 
    'Auth triggers check' as step,
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 3. Check if the trigger function exists
SELECT 
    'Function existence check' as step,
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%profile%'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 4. Specific check for our consolidated function
SELECT 
    'Consolidated function check' as step,
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_user_profile_routing';

-- 5. Test the trigger logic manually
-- This simulates what should happen when a user signs up
SELECT 
    'Manual trigger test' as step,
    'Testing trigger logic for creator account type' as description;

-- We can't directly test auth.users INSERT without actual user creation
-- But we can check if the function would work with test data

-- 6. Check RLS policies that might block trigger operations
SELECT 
    'RLS policies check' as step,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('user_buyers', 'user_creators')
ORDER BY tablename, policyname;

-- 7. Check if service role policies exist for triggers
SELECT 
    'Service role policies' as step,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('user_buyers', 'user_creators')
  AND (roles::text LIKE '%service_role%' OR roles::text LIKE '%authenticated%')
ORDER BY tablename;

-- 8. Final diagnosis query
SELECT 
    'Diagnosis summary' as step,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_schema = 'auth' 
              AND event_object_table = 'users'
              AND trigger_name LIKE '%profile%'
        ) THEN 'Trigger exists on auth.users'
        ELSE 'No profile trigger found on auth.users'
    END as trigger_status,
    
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM pg_proc 
            WHERE proname = 'handle_user_profile_routing'
        ) THEN 'Function exists'
        ELSE 'Function missing'
    END as function_status,
    
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'user_creators' 
              AND roles::text LIKE '%service_role%'
        ) THEN 'Service role policies exist'
        ELSE 'Service role policies missing'
    END as rls_status;