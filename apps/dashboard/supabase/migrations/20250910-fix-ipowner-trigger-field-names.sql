-- Fix the handle_new_ipowner trigger function to use correct field names
-- The metadata sends 'pen_name' but the trigger was looking for 'pen_name_or_studio'
-- Also fixes column name mismatch (table has 'pen_name', not 'pen_name_or_studio')

CREATE OR REPLACE FUNCTION public.handle_new_ipowner()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_ipowners (
    id, 
    email, 
    full_name, 
    pen_name,  -- Changed from pen_name_or_studio to match actual column
    ip_owner_role,
    ip_owner_company,
    website_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'pen_name',  -- Changed from pen_name_or_studio to pen_name
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
  RAISE WARNING 'Failed to create IP owner profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Also ensure the trigger exists and is properly attached
DROP TRIGGER IF EXISTS on_auth_user_ipowner_created ON auth.users;

CREATE TRIGGER on_auth_user_ipowner_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'account_type' = 'creator')
  EXECUTE FUNCTION public.handle_new_ipowner();
