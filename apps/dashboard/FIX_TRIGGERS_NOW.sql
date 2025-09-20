-- CRITICAL FIX: Clean up old triggers and apply correct consolidated trigger
-- Run this IMMEDIATELY in Supabase SQL Editor

-- ============================================
-- PART 1: FIX THE IMMEDIATE USER ISSUE
-- ============================================

-- Create missing creator profile for hyobinsungho@gmail.com
INSERT INTO user_creators (
  id,
  email,
  full_name,
  pen_name,
  invitation_status,
  created_at
)
SELECT 
  au.id,
  'hyobinsungho@gmail.com',
  COALESCE(au.raw_user_meta_data->>'full_name', 'Hyobin Lim'),
  COALESCE(au.raw_user_meta_data->>'pen_name', 'Hyobin'),
  'invited',
  now()
FROM auth.users au
WHERE au.email = 'hyobinsungho@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_creators uc WHERE uc.id = au.id
  )
ON CONFLICT (id) DO NOTHING;

-- Verify creator profile was created
SELECT 'User fix verification' as step, * FROM user_creators WHERE email = 'hyobinsungho@gmail.com';

-- ============================================
-- PART 2: REMOVE ALL OLD/CONFLICTING TRIGGERS
-- ============================================

-- Drop ALL existing triggers that are causing problems
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_creator_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_creator_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_ipowner_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_account_type_migration ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_profile_routing ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_profile_routing_update ON auth.users;

-- Drop old functions that are no longer needed
DROP FUNCTION IF EXISTS public.handle_new_user_routing();
DROP FUNCTION IF EXISTS public.handle_new_creator();
DROP FUNCTION IF EXISTS public.handle_new_ipowner();
DROP FUNCTION IF EXISTS public.handle_account_type_migration();

-- Verify all triggers are removed
SELECT 'Triggers after cleanup' as step, count(*) as trigger_count 
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' AND event_object_table = 'users';

-- ============================================
-- PART 3: CREATE THE CORRECT CONSOLIDATED TRIGGER
-- ============================================

-- Create the consolidated trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_user_profile_routing()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_account_type TEXT;
  normalized_account_type TEXT;
  profile_exists BOOLEAN := FALSE;
BEGIN
  -- Normalize account type and support legacy values
  raw_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', '');
  normalized_account_type := lower(raw_account_type);

  IF normalized_account_type = 'ip_owner' THEN
    normalized_account_type := 'creator';
  END IF;

  -- Log for debugging (will appear in Postgres logs)
  RAISE LOG 'User profile routing for user: %, email: %, raw account_type: %, normalized: %', 
    NEW.id, NEW.email, raw_account_type, normalized_account_type;
  
  -- Route based on account type in metadata
  IF normalized_account_type = 'buyer' THEN
    -- Check if buyer profile already exists (prevent duplicates)
    SELECT EXISTS(SELECT 1 FROM public.user_buyers WHERE id = NEW.id) INTO profile_exists;
    
    IF NOT profile_exists THEN
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
          WHEN NEW.raw_user_meta_data->>'buyer_role' IS NOT NULL 
           AND NEW.raw_user_meta_data->>'buyer_role' != ''
           AND NEW.raw_user_meta_data->>'buyer_role' IN ('producer', 'executive', 'agent', 'content_scout', 'other')
          THEN (NEW.raw_user_meta_data->>'buyer_role')::public.buyer_role
          ELSE NULL
        END,
        NEW.raw_user_meta_data->>'linkedin_url',
        'basic'::user_tier -- Default tier for new signups
      );
      
      RAISE LOG 'Successfully created buyer profile for user: %, email: %', NEW.id, NEW.email;
    ELSE
      RAISE LOG 'Buyer profile already exists for user: %, skipping creation', NEW.id;
    END IF;
    
  ELSIF normalized_account_type = 'creator' THEN
    -- Check if creator profile already exists (prevent duplicates)
    SELECT EXISTS(SELECT 1 FROM public.user_creators WHERE id = NEW.id) INTO profile_exists;
    
    IF NOT profile_exists THEN
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
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(
          NEW.raw_user_meta_data->>'pen_name',
          NEW.raw_user_meta_data->>'pen_name_or_studio',
          NULL
        ),
        CASE 
          WHEN NEW.raw_user_meta_data->>'ip_owner_role' IS NOT NULL 
           AND NEW.raw_user_meta_data->>'ip_owner_role' != ''
           AND NEW.raw_user_meta_data->>'ip_owner_role' IN ('author', 'agent')
          THEN (NEW.raw_user_meta_data->>'ip_owner_role')::public.ip_owner_role
          ELSE NULL
        END,
        NEW.raw_user_meta_data->>'ip_owner_company',
        NEW.raw_user_meta_data->>'website_url',
        'invited'
      );
      
      RAISE LOG 'Successfully created creator profile for user: %, email: %', NEW.id, NEW.email;
    ELSE
      RAISE LOG 'Creator profile already exists for user: %, skipping creation', NEW.id;
    END IF;
    
  ELSE
    -- Log when no account type is specified
    RAISE LOG 'No valid account_type in metadata for user: %, email: %. Metadata: %', 
      NEW.id, NEW.email, NEW.raw_user_meta_data::text;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE WARNING 'Profile creation failed for user % (email: %): % (SQLSTATE: %)', 
    NEW.id, NEW.email, SQLERRM, SQLSTATE;
  -- Still return NEW to allow user creation to proceed
  RETURN NEW;
END;
$$;

-- Create the trigger on INSERT
CREATE TRIGGER on_auth_user_profile_routing
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_user_profile_routing();

-- Create trigger for UPDATE (when account_type changes)
CREATE TRIGGER on_auth_user_profile_routing_update
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  WHEN (
    NEW.raw_user_meta_data->>'account_type' IS NOT NULL 
    AND (
      OLD.raw_user_meta_data->>'account_type' IS NULL
      OR OLD.raw_user_meta_data->>'account_type' != NEW.raw_user_meta_data->>'account_type'
    )
  )
  EXECUTE FUNCTION public.handle_user_profile_routing();

-- Add comments for documentation
COMMENT ON FUNCTION public.handle_user_profile_routing() IS 
'Consolidated user profile routing - creates profiles in user_buyers or user_creators based on account_type metadata';

COMMENT ON TRIGGER on_auth_user_profile_routing ON auth.users IS 
'Main trigger for routing new users to appropriate profile tables';

-- ============================================
-- PART 4: ADD MISSING SERVICE ROLE POLICIES
-- ============================================

-- Allow service role (triggers run as service role) to insert profiles
CREATE POLICY "Service role can insert buyer profiles" 
  ON user_buyers 
  FOR INSERT 
  TO service_role 
  WITH CHECK (true);

CREATE POLICY "Service role can insert creator profiles" 
  ON user_creators 
  FOR INSERT 
  TO service_role 
  WITH CHECK (true);

-- ============================================
-- PART 5: FINAL VERIFICATION
-- ============================================

-- Check triggers are correctly installed
SELECT 
  'Final trigger check' as step,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name LIKE '%profile%'
ORDER BY trigger_name;

-- Check function exists
SELECT 
  'Function check' as step,
  EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_user_profile_routing'
  ) as function_exists;

-- Check service role policies exist
SELECT 
  'Service role policies' as step,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('user_buyers', 'user_creators')
  AND policyname LIKE '%Service role%'
ORDER BY tablename;

-- ============================================
-- PART 6: TEST WITH A DUMMY USER (Optional)
-- ============================================

-- You can test by creating a test user through Supabase Auth UI
-- and checking if the profile is created automatically

SELECT 'Setup complete!' as status, 
       'Triggers fixed and user profile created' as message;
