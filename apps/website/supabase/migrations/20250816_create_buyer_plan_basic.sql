-- Create buyer_plan enum with 'basic' as default tier
-- This replaces the need for separate migrations

-- First check if the type already exists, if not create it
DO $$ 
BEGIN
    -- Check if buyer_plan type already exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'buyer_plan') THEN
        -- Create enum type with 'basic' as the default entry tier
        CREATE TYPE buyer_plan AS ENUM ('basic', 'pro', 'a-la-carte', 'suite');
        
        -- Add plan column to user_buyers table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'user_buyers' AND column_name = 'plan') THEN
            ALTER TABLE public.user_buyers 
            ADD COLUMN plan buyer_plan NOT NULL DEFAULT 'basic';
            
            -- Create index for better performance
            CREATE INDEX user_buyers_plan_idx ON public.user_buyers(plan);
            
            -- Add comment
            COMMENT ON COLUMN public.user_buyers.plan IS 'Pricing plan for the buyer: basic (default), pro, a-la-carte, or suite';
        END IF;
    ELSE
        -- If type exists but doesn't have 'basic', add it
        BEGIN
            ALTER TYPE buyer_plan ADD VALUE 'basic';
        EXCEPTION 
            WHEN duplicate_object THEN
                -- 'basic' already exists, do nothing
                NULL;
        END;
        
        -- Update existing 'free' users to 'basic' if any exist
        UPDATE public.user_buyers SET plan = 'basic' WHERE plan = 'free';
        
        -- Update default to 'basic'
        ALTER TABLE public.user_buyers ALTER COLUMN plan SET DEFAULT 'basic';
    END IF;
END $$;

-- Update the trigger function to handle the plan field properly
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
      linkedin_url,
      plan
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
      COALESCE((NEW.raw_user_meta_data->>'plan')::buyer_plan, 'basic'::buyer_plan)
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