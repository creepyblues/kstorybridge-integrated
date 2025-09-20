-- Debug and fix missing OAuth profiles after trigger updates
-- Run this in Supabase SQL Editor after applying the trigger fixes

-- 1. Check current trigger status
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' 
  AND trigger_schema = 'auth'
ORDER BY trigger_name;

-- 2. Check recent users and their profile status
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'account_type' as account_type,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'pen_name' as pen_name,
  CASE 
    WHEN u.raw_user_meta_data->>'account_type' = 'buyer' THEN 
      CASE WHEN b.id IS NOT NULL THEN 'HAS_BUYER_PROFILE' ELSE 'MISSING_BUYER_PROFILE' END
    WHEN u.raw_user_meta_data->>'account_type' IN ('creator', 'ip_owner') THEN 
      CASE WHEN c.id IS NOT NULL THEN 'HAS_CREATOR_PROFILE' ELSE 'MISSING_CREATOR_PROFILE' END
    ELSE 'NO_ACCOUNT_TYPE'
  END as profile_status,
  b.tier as buyer_tier,
  c.pen_name as creator_pen_name
FROM auth.users u
LEFT JOIN public.user_buyers b ON b.id = u.id
LEFT JOIN public.user_creators c ON c.id = u.id
WHERE u.created_at > NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC;

-- 3. Count profile issues
SELECT 
  'SUMMARY' as section,
  COUNT(*) as total_recent_users,
  COUNT(CASE WHEN u.raw_user_meta_data->>'account_type' = 'buyer' THEN 1 END) as buyers_with_metadata,
  COUNT(CASE WHEN u.raw_user_meta_data->>'account_type' IN ('creator', 'ip_owner') THEN 1 END) as creators_with_metadata,
  COUNT(b.id) as has_buyer_profile,
  COUNT(c.id) as has_creator_profile,
  COUNT(CASE WHEN u.raw_user_meta_data->>'account_type' = 'buyer' AND b.id IS NULL THEN 1 END) as missing_buyer_profiles,
  COUNT(CASE WHEN u.raw_user_meta_data->>'account_type' IN ('creator', 'ip_owner') AND c.id IS NULL THEN 1 END) as missing_creator_profiles
FROM auth.users u
LEFT JOIN public.user_buyers b ON b.id = u.id
LEFT JOIN public.user_creators c ON c.id = u.id
WHERE u.created_at > NOW() - INTERVAL '7 days';

-- 4. Find specific OAuth users missing creator profiles
SELECT 
  'MISSING CREATOR PROFILES' as issue_type,
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'pen_name' as pen_name,
  u.raw_user_meta_data as full_metadata
FROM auth.users u
LEFT JOIN public.user_creators c ON c.id = u.id
WHERE u.raw_user_meta_data->>'account_type' IN ('creator', 'ip_owner')
  AND c.id IS NULL
  AND u.created_at > NOW() - INTERVAL '30 days'
ORDER BY u.created_at DESC;

SELECT 
  'MISSING BUYER PROFILES' as issue_type,
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'buyer_company' as buyer_company,
  u.raw_user_meta_data as full_metadata
FROM auth.users u
LEFT JOIN public.user_buyers b ON b.id = u.id
WHERE u.raw_user_meta_data->>'account_type' = 'buyer'
  AND b.id IS NULL
  AND u.created_at > NOW() - INTERVAL '30 days'
ORDER BY u.created_at DESC;

-- 5. Manual fix for missing creator profiles (run only if needed)
-- Uncomment and modify the specific user IDs that need fixing

/*
DO $$
DECLARE
  missing_creator RECORD;
BEGIN
-- Find users with creator account_type (including legacy ip_owner) but no creator profile
  FOR missing_creator IN 
    SELECT 
      u.id,
      u.email,
      u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.user_creators c ON c.id = u.id
    WHERE u.raw_user_meta_data->>'account_type' IN ('creator', 'ip_owner')
      AND c.id IS NULL
      AND u.created_at > NOW() - INTERVAL '30 days'
  LOOP
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
        missing_creator.id,
        missing_creator.email,
        COALESCE(missing_creator.raw_user_meta_data->>'full_name', ''),
        missing_creator.raw_user_meta_data->>'pen_name',
        CASE 
          WHEN missing_creator.raw_user_meta_data->>'ip_owner_role' IS NOT NULL AND missing_creator.raw_user_meta_data->>'ip_owner_role' != ''
          THEN (missing_creator.raw_user_meta_data->>'ip_owner_role')::public.ip_owner_role
          ELSE NULL
        END,
        missing_creator.raw_user_meta_data->>'ip_owner_company',
        missing_creator.raw_user_meta_data->>'website_url',
        'invited'
      );
      
      RAISE NOTICE 'Created missing creator profile for user: %, email: %', missing_creator.id, missing_creator.email;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create creator profile for user %: % (SQLSTATE: %)', missing_creator.id, SQLERRM, SQLSTATE;
    END;
  END LOOP;
END $$;
*/

-- 6. Manual fix for missing buyer profiles (run only if needed)
-- Uncomment and modify the specific user IDs that need fixing

/*
DO $$
DECLARE
  missing_buyer RECORD;
BEGIN
  -- Find users with buyer account_type but no buyer profile
  FOR missing_buyer IN 
    SELECT 
      u.id,
      u.email,
      u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.user_buyers b ON b.id = u.id
    WHERE u.raw_user_meta_data->>'account_type' = 'buyer'
      AND b.id IS NULL
      AND u.created_at > NOW() - INTERVAL '30 days'
  LOOP
    BEGIN
      INSERT INTO public.user_buyers (
        id, 
        email, 
        full_name, 
        buyer_company,
        buyer_role,
        linkedin_url,
        tier
      )
      VALUES (
        missing_buyer.id,
        missing_buyer.email,
        COALESCE(missing_buyer.raw_user_meta_data->>'full_name', ''),
        missing_buyer.raw_user_meta_data->>'buyer_company',
        CASE 
          WHEN missing_buyer.raw_user_meta_data->>'buyer_role' IS NOT NULL AND missing_buyer.raw_user_meta_data->>'buyer_role' != ''
          THEN (missing_buyer.raw_user_meta_data->>'buyer_role')::public.buyer_role
          ELSE NULL
        END,
        missing_buyer.raw_user_meta_data->>'linkedin_url',
        COALESCE((missing_buyer.raw_user_meta_data->>'tier')::user_tier, 'basic'::user_tier)
      );
      
      RAISE NOTICE 'Created missing buyer profile for user: %, email: %', missing_buyer.id, missing_buyer.email;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create buyer profile for user %: % (SQLSTATE: %)', missing_buyer.id, SQLERRM, SQLSTATE;
    END;
  END LOOP;
END $$;
*/

-- 7. Test trigger by checking recent user creations
SELECT 
  'RECENT TRIGGER ACTIVITY' as section,
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'account_type' as account_type,
  CASE 
    WHEN u.raw_user_meta_data->>'account_type' = 'buyer' AND b.id IS NOT NULL THEN 'BUYER_PROFILE_CREATED'
    WHEN u.raw_user_meta_data->>'account_type' IN ('creator', 'ip_owner') AND c.id IS NOT NULL THEN 'CREATOR_PROFILE_CREATED'
    WHEN u.raw_user_meta_data->>'account_type' IS NOT NULL THEN 'PROFILE_MISSING'
    ELSE 'NO_ACCOUNT_TYPE'
  END as trigger_result
FROM auth.users u
LEFT JOIN public.user_buyers b ON b.id = u.id
LEFT JOIN public.user_creators c ON c.id = u.id
WHERE u.created_at > NOW() - INTERVAL '1 hour'
ORDER BY u.created_at DESC;

-- 8. Verify table and constraint health
SELECT 
  'TABLE HEALTH CHECK' as section,
  (SELECT COUNT(*) FROM public.user_buyers) as buyer_count,
  (SELECT COUNT(*) FROM public.user_creators) as creator_count,
  (SELECT COUNT(*) FROM auth.users WHERE raw_user_meta_data->>'account_type' = 'buyer') as buyer_metadata_count,
  (SELECT COUNT(*) FROM auth.users WHERE raw_user_meta_data->>'account_type' IN ('creator', 'ip_owner')) as creator_metadata_count;
