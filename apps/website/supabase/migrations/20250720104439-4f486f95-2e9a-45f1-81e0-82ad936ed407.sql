
-- Update user_buyers table to make buyer_company and buyer_role optional
ALTER TABLE public.user_buyers 
ALTER COLUMN buyer_company DROP NOT NULL,
ALTER COLUMN buyer_role DROP NOT NULL;

-- Update user_ipowners table to make pen_name_or_studio and ip_owner_role optional
ALTER TABLE public.user_ipowners 
ALTER COLUMN pen_name_or_studio DROP NOT NULL,
ALTER COLUMN ip_owner_role DROP NOT NULL;

-- Update the trigger functions to handle optional fields
CREATE OR REPLACE FUNCTION public.handle_new_buyer()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
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
      WHEN NEW.raw_user_meta_data->>'buyer_role' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'buyer_role')::buyer_role
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'linkedin_url'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create buyer profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

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
