
-- First, let's make sure the enum types exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'buyer_role') THEN
        CREATE TYPE public.buyer_role AS ENUM ('producer', 'executive', 'agent', 'content_scout', 'other');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ip_owner_role') THEN
        CREATE TYPE public.ip_owner_role AS ENUM ('author', 'illustrator', 'publisher', 'studio', 'other');
    END IF;
END $$;

-- Now recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user_routing()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'Trigger executing for user: %, account_type: %', NEW.id, NEW.raw_user_meta_data->>'account_type';
  
  -- Check the account type and call the appropriate handler with the NEW record
  IF NEW.raw_user_meta_data->>'account_type' = 'buyer' THEN
    -- Call the buyer handler function and pass the NEW record
    INSERT INTO public.user_buyers (
      id, 
      email, 
      full_name, 
      buyer_company,
      buyer_role,
      linkedin_url
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
      NEW.raw_user_meta_data->>'linkedin_url'
    );
    
    RAISE LOG 'Successfully created buyer profile for user: %', NEW.id;
    
  ELSIF NEW.raw_user_meta_data->>'account_type' = 'ip_owner' THEN
    -- Call the IP owner handler function and pass the NEW record
    INSERT INTO public.user_ipowners (
      id, 
      email, 
      full_name, 
      pen_name_or_studio,
      ip_owner_role,
      ip_owner_company,
      website_url
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
      NEW.raw_user_meta_data->>'website_url'
    );
    
    RAISE LOG 'Successfully created IP owner profile for user: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to route user creation for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_routing();
