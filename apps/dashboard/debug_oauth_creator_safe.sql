-- Safe Debug OAuth Creator Signup Issue
-- This script safely checks the current state without causing foreign key violations

-- 1. Check if the trigger exists
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND (t.tgname LIKE '%creator%' OR t.tgname LIKE '%ipowner%')
ORDER BY t.tgname;

-- 2. Check if the function exists
SELECT 
    p.proname as function_name,
    p.pronargs as num_arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND (p.proname LIKE '%creator%' OR p.proname LIKE '%ipowner%')
ORDER BY p.proname;

-- 3. Check recent users with creator account_type in metadata (last 7 days)
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data->>'account_type' as account_type,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'pen_name' as pen_name,
    raw_user_meta_data->>'ip_owner_role' as ip_owner_role,
    raw_user_meta_data->>'ip_owner_company' as ip_owner_company
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '7 days'
  AND raw_user_meta_data->>'account_type' = 'creator'
ORDER BY created_at DESC;

-- 4. Check if any user_creators records exist
SELECT COUNT(*) as total_creators FROM public.user_creators;

-- 5. Check recent user_creators records (last 7 days)
SELECT 
    id,
    email,
    full_name,
    pen_name,
    ip_owner_role,
    ip_owner_company,
    created_at
FROM public.user_creators 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 6. Check for orphaned creators (users with creator account_type but no user_creators record)
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'pen_name' as pen_name,
    CASE WHEN uc.id IS NULL THEN 'MISSING PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM auth.users u
LEFT JOIN public.user_creators uc ON u.id = uc.id
WHERE u.raw_user_meta_data->>'account_type' = 'creator'
  AND u.created_at > NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC;

-- 7. Check table constraints to understand the foreign key
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'user_creators';

-- Debug complete - results show current state of OAuth creator signup