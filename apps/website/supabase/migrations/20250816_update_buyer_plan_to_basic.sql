-- Update buyer_plan enum to use 'basic' instead of 'free'
-- This migration changes the default tier from 'free' to 'basic'

-- First, add 'basic' to the existing enum
ALTER TYPE buyer_plan ADD VALUE 'basic';

-- Update all existing 'free' plan users to 'basic'
UPDATE public.user_buyers 
SET plan = 'basic' 
WHERE plan = 'free';

-- Change the default value of the plan column to 'basic'
ALTER TABLE public.user_buyers 
ALTER COLUMN plan SET DEFAULT 'basic';

-- Update the trigger function to use 'basic' as default instead of 'free'
CREATE OR REPLACE FUNCTION public.handle_new_user_routing()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Check the account type and call the appropriate handler with the NEW record
  IF NEW.raw_user_meta_data->>'account_type' = 'buyer' THEN
    -- Call the buyer handler function and pass the NEW record
    INSERT INTO public.user_buyers (
      id, 
      email, 
      full_name, 
      buyer_company,
      buyer_role,
      linkedin_url,
      plan
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
      NEW.raw_user_meta_data->>'linkedin_url',
      COALESCE((NEW.raw_user_meta_data->>'plan')::buyer_plan, 'basic'::buyer_plan)
    );
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
        WHEN NEW.raw_user_meta_data->>'ip_owner_role' IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'ip_owner_role')::ip_owner_role
        ELSE NULL
      END,
      NEW.raw_user_meta_data->>'ip_owner_company',
      NEW.raw_user_meta_data->>'website_url'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to route user creation for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Update comment to reflect the new default
COMMENT ON COLUMN public.user_buyers.plan IS 'Pricing plan for the buyer: basic (default), pro, a-la-carte, or suite';