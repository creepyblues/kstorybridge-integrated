-- Align Website app with Dashboard app schema
-- The Dashboard app uses 'tier' column with user_tier enum
-- This migration ensures consistency across both apps

-- First, create user_tier enum if it doesn't exist (matches Dashboard schema)
DO $$ 
BEGIN
    -- Check if user_tier type already exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_tier') THEN
        -- Create enum type matching Dashboard app
        CREATE TYPE user_tier AS ENUM ('invited', 'basic', 'pro', 'suite');
        RAISE LOG 'Created user_tier enum type';
    ELSE
        RAISE LOG 'user_tier enum type already exists';
    END IF;
END $$;

-- Ensure the user_buyers table has the tier column (not plan)
DO $$ 
BEGIN
    -- Add tier column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'user_buyers' AND column_name = 'tier') THEN
        ALTER TABLE public.user_buyers 
        ADD COLUMN tier user_tier DEFAULT 'basic';
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS user_buyers_tier_idx ON public.user_buyers(tier);
        
        -- Add comment
        COMMENT ON COLUMN public.user_buyers.tier IS 'User tier: invited (waiting approval), basic (standard access), pro (premium features), suite (full access)';
        
        RAISE LOG 'Added tier column to user_buyers table';
    ELSE
        RAISE LOG 'tier column already exists in user_buyers table';
    END IF;
    
    -- Remove plan column if it exists (from old migrations)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'user_buyers' AND column_name = 'plan') THEN
        -- Copy data from plan to tier if tier is null
        UPDATE public.user_buyers 
        SET tier = CASE 
            WHEN plan = 'basic' THEN 'basic'::user_tier
            WHEN plan = 'pro' THEN 'pro'::user_tier
            WHEN plan = 'a-la-carte' THEN 'pro'::user_tier  -- Map a-la-carte to pro
            WHEN plan = 'suite' THEN 'suite'::user_tier
            ELSE 'basic'::user_tier
        END
        WHERE tier IS NULL;
        
        -- Drop the old plan column and its index
        DROP INDEX IF EXISTS user_buyers_plan_idx;
        ALTER TABLE public.user_buyers DROP COLUMN IF EXISTS plan;
        
        RAISE LOG 'Migrated plan column data to tier column and removed plan column';
    END IF;
    
    -- Remove buyer_plan enum type if it exists (from old migrations)
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'buyer_plan') THEN
        DROP TYPE buyer_plan CASCADE;
        RAISE LOG 'Removed old buyer_plan enum type';
    END IF;
END $$;

-- Update the trigger function to use tier instead of plan
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