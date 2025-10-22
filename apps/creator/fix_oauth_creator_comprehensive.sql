-- Comprehensive OAuth Creator Fix
-- This addresses multiple potential issues with OAuth creator signup

-- 1. Create/Update the creator function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_creator()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'Creator trigger fired for user: %, account_type: %', NEW.id, NEW.raw_user_meta_data->>'account_type';
  
  -- Check if profile already exists to avoid duplicates
  IF EXISTS (SELECT 1 FROM public.user_creators WHERE id = NEW.id) THEN
    RAISE LOG 'Creator profile already exists for user: %', NEW.id;
    RETURN NEW;
  END IF;
  
  INSERT INTO public.user_creators (
    id, 
    email, 
    full_name, 
    pen_name,
    ip_owner_role,
    ip_owner_company,
    website_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'pen_name',
    CASE 
      WHEN NEW.raw_user_meta_data->>'ip_owner_role' IS NOT NULL 
        AND NEW.raw_user_meta_data->>'ip_owner_role' != ''
      THEN (NEW.raw_user_meta_data->>'ip_owner_role')::ip_owner_role
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'ip_owner_company',
    NEW.raw_user_meta_data->>'website_url',
    NOW(),
    NOW()
  );
  
  RAISE LOG 'Creator profile created successfully for user: %', NEW.id;
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create creator profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- 2. Drop all existing triggers to ensure clean state
DROP TRIGGER IF EXISTS on_auth_user_ipowner_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_creator_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_creator_updated ON auth.users;

-- 3. Create INSERT trigger for new users
CREATE TRIGGER on_auth_user_creator_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'account_type' = 'creator')
  EXECUTE FUNCTION public.handle_new_creator();

-- 4. Create UPDATE trigger for OAuth flow (metadata added after user creation)
CREATE TRIGGER on_auth_user_creator_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  WHEN (
    NEW.raw_user_meta_data->>'account_type' = 'creator' 
    AND (
      OLD.raw_user_meta_data->>'account_type' IS NULL 
      OR OLD.raw_user_meta_data->>'account_type' != 'creator'
    )
  )
  EXECUTE FUNCTION public.handle_new_creator();

-- 5. Also handle the case where account_type metadata is normalized to 'creator'
CREATE OR REPLACE FUNCTION public.handle_account_type_migration()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- If account_type changed from ip_owner to creator, create creator profile
  IF OLD.raw_user_meta_data->>'account_type' = 'creator' 
     AND NEW.raw_user_meta_data->>'account_type' = 'creator' THEN
    
    RAISE LOG 'Migrating user from ip_owner to creator: %', NEW.id;
    
    -- Check if creator profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.user_creators WHERE id = NEW.id) THEN
      INSERT INTO public.user_creators (
        id, 
        email, 
        full_name, 
        pen_name,
        ip_owner_role,
        ip_owner_company,
        website_url,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'pen_name',
        CASE 
          WHEN NEW.raw_user_meta_data->>'ip_owner_role' IS NOT NULL 
            AND NEW.raw_user_meta_data->>'ip_owner_role' != ''
          THEN (NEW.raw_user_meta_data->>'ip_owner_role')::ip_owner_role
          ELSE NULL
        END,
        NEW.raw_user_meta_data->>'ip_owner_company',
        NEW.raw_user_meta_data->>'website_url',
        NOW(),
        NOW()
      );
      RAISE LOG 'Creator profile created during migration for user: %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to migrate user % from ip_owner to creator: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 6. Create migration trigger
DROP TRIGGER IF EXISTS on_auth_user_account_type_migration ON auth.users;
CREATE TRIGGER on_auth_user_account_type_migration
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_account_type_migration();

-- 7. Clean up old functions
DROP FUNCTION IF EXISTS public.handle_new_ipowner();

-- Comprehensive OAuth creator fix applied

-- 8. Test the triggers
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND (t.tgname LIKE '%creator%' OR t.tgname LIKE '%migration%')
ORDER BY t.tgname;
