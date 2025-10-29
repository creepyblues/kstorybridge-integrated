-- Debug OAuth creator signup issue
-- Run this in Supabase SQL Editor

-- 1. Check recent OAuth users who should have creator profiles but don't
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'account_type' as account_type,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'pen_name' as pen_name,
    u.raw_user_meta_data as full_metadata,
    ip.id as profile_id,
    ip.email as profile_email
FROM auth.users u
LEFT JOIN public.user_creators ip ON ip.email = u.email
WHERE u.created_at > NOW() - INTERVAL '2 hours'
AND (u.raw_user_meta_data->>'account_type' = 'creator' OR ip.id IS NULL)
ORDER BY u.created_at DESC;

-- 2. Check what triggers are currently active
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth'
ORDER BY trigger_name;

-- 3. Check the current routing function
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE proname = 'handle_new_user_routing';

-- 4. Check if there are any OAuth users without account_type metadata
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data,
    CASE 
        WHEN u.raw_user_meta_data->>'account_type' IS NULL THEN 'NO_ACCOUNT_TYPE'
        ELSE u.raw_user_meta_data->>'account_type'
    END as account_type_status
FROM auth.users u
WHERE u.created_at > NOW() - INTERVAL '2 hours'
ORDER BY u.created_at DESC;

-- 5. Check for any errors in PostgreSQL logs related to triggers
-- (This requires superuser access, might not work)
-- SELECT * FROM pg_stat_statements WHERE query LIKE '%handle_new_user_routing%';

-- 6. Test the trigger function manually with a sample user
-- Find a recent OAuth user without a profile
DO $$
DECLARE
    test_user RECORD;
    result_text TEXT;
BEGIN
    -- Find a recent OAuth user without an IP owner profile
    SELECT u.* INTO test_user
    FROM auth.users u
    LEFT JOIN public.user_creators ip ON ip.email = u.email
    WHERE u.raw_user_meta_data->>'account_type' = 'creator'
    AND ip.id IS NULL
    AND u.created_at > NOW() - INTERVAL '2 hours'
    LIMIT 1;
    
    IF test_user.id IS NOT NULL THEN
        RAISE NOTICE 'Found OAuth user without profile: %, email: %, metadata: %', 
            test_user.id, test_user.email, test_user.raw_user_meta_data::text;
        
        -- Check if the user should have a profile based on metadata
        IF test_user.raw_user_meta_data->>'account_type' = 'creator' THEN
            RAISE NOTICE 'User should have creator profile but does not';
            
            -- Try to manually create the profile to test the logic
            BEGIN
                INSERT INTO public.user_creators (
                    id, 
                    email, 
                    full_name, 
                    pen_name,
                    ip_owner_role,
                    ip_owner_company,
                    website_url,
                    invitation_status
                )
                VALUES (
                    test_user.id,
                    test_user.email,
                    COALESCE(test_user.raw_user_meta_data->>'full_name', ''),
                    test_user.raw_user_meta_data->>'pen_name',
                    CASE 
                        WHEN test_user.raw_user_meta_data->>'ip_owner_role' IS NOT NULL 
                        THEN (test_user.raw_user_meta_data->>'ip_owner_role')::public.ip_owner_role
                        ELSE NULL
                    END,
                    test_user.raw_user_meta_data->>'ip_owner_company',
                    test_user.raw_user_meta_data->>'website_url',
                    'invited'
                )
                ON CONFLICT (email) DO NOTHING;
                
                RAISE NOTICE 'Successfully created profile for user: %', test_user.email;
                
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
            END;
        END IF;
    ELSE
        RAISE NOTICE 'No OAuth users without profiles found in last 2 hours';
    END IF;
END $$;

-- 7. Check if the trigger is actually firing by looking at function calls
-- Enable logging for debugging (requires superuser)
-- ALTER DATABASE postgres SET log_statement = 'all';
-- SET log_min_messages = 'notice';

-- 8. Verify the trigger condition logic
SELECT 
    'Testing trigger condition' as test,
    CASE 
        WHEN u.raw_user_meta_data->>'account_type' = 'creator' THEN 'WOULD TRIGGER'
        ELSE 'WOULD NOT TRIGGER'
    END as trigger_result,
    u.email,
    u.raw_user_meta_data->>'account_type' as account_type
FROM auth.users u
WHERE u.created_at > NOW() - INTERVAL '2 hours'
ORDER BY u.created_at DESC;

-- 9. Final summary check
SELECT 
    'SUMMARY' as section,
    COUNT(*) as total_recent_users,
    COUNT(CASE WHEN u.raw_user_meta_data->>'account_type' = 'creator' THEN 1 END) as oauth_creators,
    COUNT(ip.id) as has_creator_profile,
    COUNT(CASE WHEN u.raw_user_meta_data->>'account_type' = 'creator' AND ip.id IS NULL THEN 1 END) as missing_profiles
FROM auth.users u
LEFT JOIN public.user_creators ip ON ip.email = u.email
WHERE u.created_at > NOW() - INTERVAL '2 hours';
