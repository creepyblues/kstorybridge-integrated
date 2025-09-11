-- Debug query for OAuth creator signup flow
-- Run this in Supabase SQL Editor to check if creator profiles are being created

-- Check recent auth.users entries (last 24 hours)
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data->>'account_type' as account_type,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'pen_name' as pen_name,
    raw_user_meta_data->>'oauth_completion_pending' as oauth_pending,
    raw_app_metadata->>'provider' as provider
FROM auth.users
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- Check if corresponding creator profiles exist
SELECT 
    uc.id,
    uc.email,
    uc.full_name,
    uc.pen_name,
    uc.created_at,
    au.email as auth_email,
    au.raw_user_meta_data->>'account_type' as auth_account_type
FROM user_creators uc
FULL OUTER JOIN auth.users au ON au.email = uc.email
WHERE uc.created_at > NOW() - INTERVAL '24 hours'
   OR au.created_at > NOW() - INTERVAL '24 hours'
ORDER BY COALESCE(uc.created_at, au.created_at) DESC
LIMIT 10;

-- Check for orphaned auth users (creators without profiles)
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data->>'account_type' as account_type,
    au.raw_user_meta_data->>'pen_name' as pen_name,
    uc.id as creator_profile_id
FROM auth.users au
LEFT JOIN user_creators uc ON au.email = uc.email
WHERE au.raw_user_meta_data->>'account_type' = 'creator'
  AND uc.id IS NULL
  AND au.created_at > NOW() - INTERVAL '7 days'
ORDER BY au.created_at DESC;

-- Check trigger status (should all be enabled = 1)
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_orientation,
    action_timing,
    enabled
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Check if RLS is enabled on user_creators
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_creators';

-- List all RLS policies on user_creators table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_creators';

-- Check sessionStorage workaround - recent sign-ins
SELECT 
    au.id,
    au.email,
    au.last_sign_in_at,
    au.raw_user_meta_data->>'account_type' as stored_account_type,
    CASE 
        WHEN uc.id IS NOT NULL THEN 'creator'
        WHEN ub.id IS NOT NULL THEN 'buyer'
        ELSE 'none'
    END as actual_profile_type
FROM auth.users au
LEFT JOIN user_creators uc ON au.email = uc.email
LEFT JOIN user_buyers ub ON au.email = ub.email
WHERE au.last_sign_in_at > NOW() - INTERVAL '1 hour'
ORDER BY au.last_sign_in_at DESC
LIMIT 10;