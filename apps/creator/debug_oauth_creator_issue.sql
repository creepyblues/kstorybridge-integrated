-- Debug OAuth Creator Signup Issue
-- This script will help identify why user_creators records aren't being created

-- 1. Check if the trigger exists
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND t.tgname LIKE '%creator%';

-- 2. Check if the function exists
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname LIKE '%creator%';

-- 3. Check recent users with creator account_type in metadata
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data->>'account_type' as account_type,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'pen_name' as pen_name
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND raw_user_meta_data->>'account_type' = 'creator'
ORDER BY created_at DESC;

-- 4. Check if any user_creators records exist
SELECT COUNT(*) as total_creators FROM public.user_creators;

-- 5. Check recent user_creators records
SELECT 
    id,
    email,
    full_name,
    pen_name,
    created_at
FROM public.user_creators 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 6. Manual test: Try to insert a test creator record to see if table is accessible
BEGIN;
    INSERT INTO public.user_creators (
        id, 
        email, 
        full_name, 
        pen_name
    ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'test@example.com',
        'Test Creator',
        'Test Pen Name'
    );
    -- Manual insertion successful - table is accessible
ROLLBACK;

-- Debug complete