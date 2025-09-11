-- Fix Duplicate Creator Profile Creation
-- 
-- Issue: Multiple triggers are creating duplicate profiles for OAuth creator signups:
-- 1. on_auth_user_created → handle_new_user_routing() 
-- 2. on_auth_user_creator_created → handle_new_creator()
-- 
-- Both triggers fire for creator users, potentially causing conflicts.
-- Solution: Consolidate to single trigger with robust logic.

-- First, let's check what triggers currently exist
-- and drop the conflicting ones to use only one consolidated trigger

-- Drop all existing conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_creator_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_creator_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_ipowner_created ON auth.users;

-- Keep the legacy profiles trigger for backward compatibility
-- DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users; -- Keep this one

-- Create a single, robust user routing function
CREATE OR REPLACE FUNCTION public.handle_user_profile_routing()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  account_type_value TEXT;
  profile_exists BOOLEAN := FALSE;
BEGIN
  -- Get account type from metadata
  account_type_value := NEW.raw_user_meta_data->>'account_type';
  
  -- Enhanced logging for debugging
  RAISE LOG 'User profile routing for user: %, email: %, account_type: %', 
    NEW.id, NEW.email, account_type_value;
  
  -- Route based on account type in metadata
  IF account_type_value = 'buyer' THEN
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
          WHEN NEW.raw_user_meta_data->>'buyer_role' IS NOT NULL AND NEW.raw_user_meta_data->>'buyer_role' != ''
          THEN (NEW.raw_user_meta_data->>'buyer_role')::public.buyer_role
          ELSE NULL
        END,
        NEW.raw_user_meta_data->>'linkedin_url',
        COALESCE((NEW.raw_user_meta_data->>'tier')::user_tier, 'basic'::user_tier)
      );
      
      RAISE LOG 'Successfully created buyer profile for user: %, email: %', NEW.id, NEW.email;
    ELSE
      RAISE LOG 'Buyer profile already exists for user: %, skipping creation', NEW.id;
    END IF;
    
  ELSIF account_type_value = 'creator' THEN
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
        NEW.raw_user_meta_data->>'pen_name',
        CASE 
          WHEN NEW.raw_user_meta_data->>'ip_owner_role' IS NOT NULL AND NEW.raw_user_meta_data->>'ip_owner_role' != ''
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
    
  ELSIF account_type_value = 'ip_owner' THEN
    -- Legacy support for ip_owner account type (map to creator)
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
        NEW.raw_user_meta_data->>'pen_name_or_studio',
        CASE 
          WHEN NEW.raw_user_meta_data->>'ip_owner_role' IS NOT NULL AND NEW.raw_user_meta_data->>'ip_owner_role' != ''
          THEN (NEW.raw_user_meta_data->>'ip_owner_role')::public.ip_owner_role
          ELSE NULL
        END,
        NEW.raw_user_meta_data->>'ip_owner_company',
        NEW.raw_user_meta_data->>'website_url',
        'invited'
      );
      
      RAISE LOG 'Successfully created creator profile (legacy ip_owner) for user: %, email: %', NEW.id, NEW.email;
    ELSE
      RAISE LOG 'Creator profile already exists for legacy ip_owner user: %, skipping creation', NEW.id;
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

-- Create the single trigger that handles all user routing
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

-- Clean up old functions that are no longer needed
DROP FUNCTION IF EXISTS public.handle_new_user_routing();
DROP FUNCTION IF EXISTS public.handle_new_creator();
DROP FUNCTION IF EXISTS public.handle_new_ipowner();

-- Create a cleanup function to remove duplicate profiles
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_creator_profiles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  action TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find users who have BOTH buyer and creator profiles when they should only have creator
  FOR user_record IN
    SELECT DISTINCT
      uc.id,
      uc.email
    FROM user_creators uc
    INNER JOIN user_buyers ub ON uc.id = ub.id
    INNER JOIN auth.users au ON au.id = uc.id
    WHERE au.raw_user_meta_data->>'account_type' = 'creator'
  LOOP
    -- Remove the buyer profile for users who should be creators
    DELETE FROM public.user_buyers WHERE id = user_record.id;
    
    -- Return the action taken
    user_id := user_record.id;
    email := user_record.email;
    action := 'Removed duplicate buyer profile for creator user';
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Run the cleanup function to fix existing duplicate profiles
SELECT * FROM public.cleanup_duplicate_creator_profiles();

-- Report the fix
RAISE NOTICE 'Fixed duplicate creator profile creation issue by consolidating triggers and cleaning up existing duplicates';