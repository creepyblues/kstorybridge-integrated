-- Fix database trigger to consistently handle the modern 'creator' account type

-- Normalize any remaining legacy metadata values to 'creator'
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{account_type}', '"creator"', false)
WHERE raw_user_meta_data->>'account_type' = 'ip_owner';

-- Update the trigger function to route only buyer/creator accounts
CREATE OR REPLACE FUNCTION public.handle_new_user_routing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enhanced logging for debugging
  RAISE LOG 'handle_new_user_routing triggered for user: %, email: %, account_type: %',
    NEW.id, NEW.email, NEW.raw_user_meta_data->>'account_type';

  -- Route based on account type in metadata
  IF NEW.raw_user_meta_data->>'account_type' = 'buyer' THEN
    -- Create buyer profile
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
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate creation

    RAISE LOG 'Successfully created buyer profile for user: %, email: %', NEW.id, NEW.email;

  ELSIF NEW.raw_user_meta_data->>'account_type' = 'creator' THEN
    -- Create creator profile
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
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate creation

    RAISE LOG 'Successfully created creator profile for user: %, email: %',
      NEW.id, NEW.email;

  ELSE
    -- Log when no account type is specified (common for OAuth first-time users)
    RAISE LOG 'No account_type specified for user: %, email: %. Profile creation skipped.', NEW.id, NEW.email;
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

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_routing();

-- Add comment for future reference
COMMENT ON FUNCTION public.handle_new_user_routing() IS 'Routes new user creation to appropriate profile tables based on account_type metadata. Supports buyer and creator accounts.';
