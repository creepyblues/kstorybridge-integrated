-- Apply Missing Trigger for Profile Creation
-- This should have been applied by migration but is missing

-- First, create the consolidated trigger function
CREATE OR REPLACE FUNCTION public.handle_user_profile_routing()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  raw_account_type TEXT;
  normalized_account_type TEXT;
  profile_exists BOOLEAN := FALSE;
BEGIN
  -- Normalize account type and handle legacy values
  raw_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', '');
  normalized_account_type := lower(raw_account_type);

  IF normalized_account_type = 'ip_owner' THEN
    normalized_account_type := 'creator';
  END IF;
  
  -- Enhanced logging for debugging
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
          WHEN NULLIF(NEW.raw_user_meta_data->>'buyer_role', '') IS NOT NULL
          THEN (NEW.raw_user_meta_data->>'buyer_role')::public.buyer_role
          ELSE NULL
        END,
        NEW.raw_user_meta_data->>'linkedin_url',
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'tier', '')::user_tier, 'basic'::user_tier)
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
        NULLIF(NEW.raw_user_meta_data->>'pen_name', ''),
        CASE 
          WHEN NULLIF(NEW.raw_user_meta_data->>'ip_owner_role', '') IS NOT NULL
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
    -- Log when no account type is specified (common for OAuth first-time users)
    RAISE LOG 'No valid account_type specified for user: %, email: %. Profile creation skipped. Metadata: %', 
      NEW.id, NEW.email, NEW.raw_user_meta_data::text;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Enhanced error logging
  RAISE WARNING 'Failed to route user creation for user % (email: %): % (SQLSTATE: %)', 
    NEW.id, NEW.email, SQLERRM, SQLSTATE;
  RAISE WARNING 'User metadata: %', NEW.raw_user_meta_data::text;
  -- Don't fail the user creation process
  RETURN NEW;
END;
$$;

-- Drop any existing conflicting triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_creator_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_creator_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_ipowner_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_profile_routing ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_profile_routing_update ON auth.users;

-- Create the consolidated trigger
CREATE TRIGGER on_auth_user_profile_routing
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_user_profile_routing();

-- Also create an update trigger to handle cases where account_type is set after user creation
CREATE TRIGGER on_auth_user_profile_routing_update
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  WHEN (
    NEW.raw_user_meta_data->>'account_type' IS NOT NULL 
    AND OLD.raw_user_meta_data->>'account_type' IS DISTINCT FROM NEW.raw_user_meta_data->>'account_type'
  )
  EXECUTE FUNCTION public.handle_user_profile_routing();

-- Add helpful comments
COMMENT ON FUNCTION public.handle_user_profile_routing() IS 
'Consolidated user profile routing function that creates profiles in user_buyers or user_creators tables based on account_type metadata. Prevents duplicate profile creation.';

COMMENT ON TRIGGER on_auth_user_profile_routing ON auth.users IS 
'Trigger to route new users to appropriate profile tables. Replaces multiple competing triggers.';

COMMENT ON TRIGGER on_auth_user_profile_routing_update ON auth.users IS 
'Trigger to handle account type changes after user creation (e.g., OAuth flows).';

-- Verify the trigger was created
SELECT 
    'Verification' as step,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name LIKE '%profile%'
ORDER BY trigger_name;

-- Also verify the function exists
SELECT 
    'Function verification' as step,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_user_profile_routing';
