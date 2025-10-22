-- Fix the creator signup trigger to enforce the normalized 'creator' account type
-- and ensure it inserts into the correct table (user_creators)

-- First, let's update the trigger function to use the correct table and account type
CREATE OR REPLACE FUNCTION public.handle_new_creator()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_creators (
    id, 
    email, 
    full_name, 
    pen_name,
    ip_owner_role,
    ip_owner_company,
    website_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'pen_name',
    CASE 
      WHEN NEW.raw_user_meta_data->>'ip_owner_role' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'ip_owner_role')::ip_owner_role
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'ip_owner_company',
    NEW.raw_user_meta_data->>'website_url'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create creator profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Drop the old trigger and create the new one with correct condition
DROP TRIGGER IF EXISTS on_auth_user_ipowner_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_creator_created ON auth.users;

CREATE TRIGGER on_auth_user_creator_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'account_type' = 'creator')
  EXECUTE FUNCTION public.handle_new_creator();

-- Also create an update trigger to handle cases where account_type is set after user creation
DROP TRIGGER IF EXISTS on_auth_user_creator_updated ON auth.users;

CREATE TRIGGER on_auth_user_creator_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  WHEN (
    NEW.raw_user_meta_data->>'account_type' = 'creator' 
    AND OLD.raw_user_meta_data->>'account_type' IS DISTINCT FROM 'creator'
  )
  EXECUTE FUNCTION public.handle_new_creator();

-- Clean up the old function
DROP FUNCTION IF EXISTS public.handle_new_ipowner();
