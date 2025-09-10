-- Debug and fix creator profile creation issue
-- Run this in Supabase SQL Editor

-- 1. First, let's check what triggers currently exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth'
ORDER BY trigger_name;

-- 2. Check the current handle_new_user_routing function
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE proname IN ('handle_new_user_routing', 'handle_new_ipowner', 'handle_new_buyer')
ORDER BY proname;

-- 3. Check if there's a recent user that should have a profile but doesn't
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'account_type' as account_type,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'pen_name' as pen_name,
    ip.id as ipowner_id
FROM auth.users u
LEFT JOIN public.user_creators ip ON ip.email = u.email
WHERE u.raw_user_meta_data->>'account_type' = 'ip_owner'
AND u.created_at > NOW() - INTERVAL '24 hours'
ORDER BY u.created_at DESC;

-- 4. Let's ensure we have the correct trigger and function
-- First, drop any conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_ipowner_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_buyer_created ON auth.users;

-- 5. Make sure the main routing function is correct
CREATE OR REPLACE FUNCTION public.handle_new_user_routing()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RAISE LOG 'handle_new_user_routing triggered for user: %, account_type: %', 
    NEW.id, NEW.raw_user_meta_data->>'account_type';
  
  -- Route based on account type
  IF NEW.raw_user_meta_data->>'account_type' = 'buyer' THEN
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
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.raw_user_meta_data->>'buyer_company',
      CASE 
        WHEN NEW.raw_user_meta_data->>'buyer_role' IS NOT NULL AND NEW.raw_user_meta_data->>'buyer_role' != ''
        THEN (NEW.raw_user_meta_data->>'buyer_role')::public.buyer_role
        ELSE NULL
      END,
      NEW.raw_user_meta_data->>'linkedin_url',
      COALESCE((NEW.raw_user_meta_data->>'tier')::user_tier, 'basic'::user_tier)
    );
    
    RAISE LOG 'Successfully created buyer profile for user: %', NEW.id;
    
  ELSIF NEW.raw_user_meta_data->>'account_type' = 'ip_owner' THEN
    INSERT INTO public.user_creators (
      id, 
      email, 
      full_name, 
      pen_name,  -- This is the correct field name
      ip_owner_role,
      ip_owner_company,
      website_url,
      invitation_status
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.raw_user_meta_data->>'pen_name',  -- Using pen_name from metadata
      CASE 
        WHEN NEW.raw_user_meta_data->>'ip_owner_role' IS NOT NULL AND NEW.raw_user_meta_data->>'ip_owner_role' != ''
        THEN (NEW.raw_user_meta_data->>'ip_owner_role')::public.ip_owner_role
        ELSE NULL
      END,
      NEW.raw_user_meta_data->>'ip_owner_company',
      NEW.raw_user_meta_data->>'website_url',
      'invited'
    );
    
    RAISE LOG 'Successfully created IP owner profile for user: %', NEW.id;
  ELSE
    RAISE LOG 'No account_type specified for user: %, skipping profile creation', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to route user creation for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  -- Log more details for debugging
  RAISE WARNING 'User metadata: %', NEW.raw_user_meta_data::text;
  RETURN NEW;
END;
$$;

-- 6. Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_routing();

-- 7. Test with a recent user who doesn't have a profile
-- (This will only work if there's a user without a profile)
DO $$
DECLARE
  test_user RECORD;
BEGIN
  -- Find a recent ip_owner user without a profile
  SELECT u.* INTO test_user
  FROM auth.users u
  LEFT JOIN public.user_creators ip ON ip.email = u.email
  WHERE u.raw_user_meta_data->>'account_type' = 'ip_owner'
  AND ip.id IS NULL
  AND u.created_at > NOW() - INTERVAL '24 hours'
  LIMIT 1;
  
  IF test_user.id IS NOT NULL THEN
    RAISE NOTICE 'Found user without profile: %, email: %', test_user.id, test_user.email;
    
    -- Manually create the profile
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
    
    RAISE NOTICE 'Created profile for user: %', test_user.email;
  ELSE
    RAISE NOTICE 'No users found without profiles';
  END IF;
END $$;

-- 8. Verify the fix worked
SELECT 
    u.email,
    u.created_at as user_created,
    u.raw_user_meta_data->>'account_type' as account_type,
    ip.id as profile_id,
    ip.pen_name,
    ip.created_at as profile_created
FROM auth.users u
LEFT JOIN public.user_creators ip ON ip.email = u.email
WHERE u.raw_user_meta_data->>'account_type' = 'ip_owner'
ORDER BY u.created_at DESC
LIMIT 10;