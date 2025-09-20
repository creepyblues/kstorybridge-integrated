-- ============================================
-- MIGRATION: Rename user_ipowners to user_creators (FIXED VERSION)
-- ============================================
-- This script safely renames the user_ipowners table to user_creators
-- while preserving all data, constraints, indexes, and policies.
-- 
-- FIXED: Resolves "no unique or exclusion constraint matching" error
-- 
-- IMPORTANT: Run this in a transaction and test thoroughly before production!
-- 
-- Usage:
-- 1. Run this script on Supabase SQL Editor
-- 2. Test all functionality after migration
-- 3. Update any external integrations/scripts
-- 
-- Rollback: See ROLLBACK section at the bottom if needed
-- ============================================

BEGIN;

-- Step 1: Create the new table with identical structure AND constraints
CREATE TABLE IF NOT EXISTS public.user_creators (
    id UUID NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    pen_name TEXT,
    ip_owner_role public.ip_owner_role,
    ip_owner_company TEXT,
    website_url TEXT,
    invitation_status TEXT DEFAULT 'invited'::TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Add constraints immediately during table creation
    CONSTRAINT user_creators_pkey PRIMARY KEY (id),
    CONSTRAINT user_creators_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Step 2: Check if table already has data (in case of retry)
DO $$
DECLARE
    existing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO existing_count FROM public.user_creators;
    IF existing_count > 0 THEN
        RAISE NOTICE 'Table user_creators already has % records, skipping data copy', existing_count;
    ELSE
        -- Copy all data from user_ipowners to user_creators
        INSERT INTO public.user_creators (
            id, email, full_name, pen_name, ip_owner_role, 
            ip_owner_company, website_url, invitation_status, 
            created_at, updated_at
        )
        SELECT 
            id, email, full_name, pen_name, ip_owner_role, 
            ip_owner_company, website_url, invitation_status, 
            created_at, updated_at
        FROM public.user_ipowners
        ON CONFLICT (id) DO NOTHING;
        
        GET DIAGNOSTICS existing_count = ROW_COUNT;
        RAISE NOTICE 'Copied % records from user_ipowners to user_creators', existing_count;
    END IF;
END $$;

-- Step 3: Create indexes on the new table
CREATE INDEX IF NOT EXISTS user_creators_email_idx ON public.user_creators(email);
CREATE INDEX IF NOT EXISTS user_creators_invitation_status_idx ON public.user_creators(invitation_status);

-- Step 4: Enable RLS on the new table
ALTER TABLE public.user_creators ENABLE ROW LEVEL SECURITY;

-- Step 5: Copy RLS policies from old table to new table
-- Check existing policies on user_ipowners and recreate them for user_creators

-- Policy 1: Users can select their own profile
DROP POLICY IF EXISTS "Users can select their own profile" ON public.user_creators;
CREATE POLICY "Users can select their own profile"
    ON public.user_creators FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy 2: Authenticated users can insert creator profile
DROP POLICY IF EXISTS "Authenticated users can insert creator profile" ON public.user_creators;
DROP POLICY IF EXISTS "Authenticated users can insert IP owner profile" ON public.user_creators;
CREATE POLICY "Authenticated users can insert creator profile"
    ON public.user_creators FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy 3: Authenticated users can update creator profile  
DROP POLICY IF EXISTS "Authenticated users can update creator profile" ON public.user_creators;
DROP POLICY IF EXISTS "Authenticated users can upsert IP owner profile" ON public.user_creators;
CREATE POLICY "Authenticated users can update creator profile"
    ON public.user_creators FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Step 6: Update the trigger function to use new table name
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
    
  ELSIF lower(COALESCE(NEW.raw_user_meta_data->>'account_type', '')) IN ('creator', 'ip_owner') THEN
    -- Call the creator handler function and pass the NEW record (UPDATED TO USE user_creators)
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
    
    RAISE LOG 'Successfully created creator profile for user: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to route user creation for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- Step 7: Verify data integrity
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM public.user_ipowners;
    SELECT COUNT(*) INTO new_count FROM public.user_creators;
    
    IF old_count != new_count THEN
        RAISE EXCEPTION 'Data migration failed! Old table has % records, new table has % records', old_count, new_count;
    END IF;
    
    RAISE NOTICE 'Data migration successful: % records in user_ipowners, % records in user_creators', old_count, new_count;
END $$;

-- Step 8: Verify the new table works correctly
DO $$
DECLARE
    test_record RECORD;
BEGIN
    -- Test basic select query
    SELECT id, email, full_name, pen_name INTO test_record 
    FROM public.user_creators 
    LIMIT 1;
    
    IF test_record.id IS NOT NULL THEN
        RAISE NOTICE 'Table verification successful: Found record with id %', test_record.id;
    ELSE
        RAISE NOTICE 'Table is empty but structure is correct';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Table verification failed: %', SQLERRM;
END $$;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after the migration to verify everything worked:

-- 1. Check table exists and has data
SELECT 'user_creators' as table_name, COUNT(*) as record_count FROM public.user_creators;
SELECT 'user_ipowners' as table_name, COUNT(*) as record_count FROM public.user_ipowners;

-- 2. Check constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.user_creators'::regclass;

-- 3. Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'user_creators' AND schemaname = 'public';

-- 4. Check RLS policies
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_creators' AND schemaname = 'public';

-- 5. Test a sample query
SELECT id, email, full_name, pen_name, invitation_status 
FROM public.user_creators 
LIMIT 5;

-- 6. Compare data between tables
SELECT 
    (SELECT COUNT(*) FROM public.user_ipowners) as old_table_count,
    (SELECT COUNT(*) FROM public.user_creators) as new_table_count;

-- ============================================
-- OPTIONAL: DROP OLD TABLE (AFTER VERIFICATION)
-- ============================================
-- Uncomment these lines only after verifying everything works correctly:
-- 
-- -- Create backup before dropping
-- CREATE TABLE user_ipowners_backup AS SELECT * FROM user_ipowners;
-- 
-- -- Drop the old table
-- DROP TABLE IF EXISTS public.user_ipowners CASCADE;
-- 
-- IMPORTANT: Before dropping the old table:
-- 1. Test all application functionality
-- 2. Verify all queries work with new table name
-- 3. Update any external integrations
-- 4. Monitor for 24-48 hours

-- ============================================
-- ROLLBACK PROCEDURE (if needed)
-- ============================================
-- If something goes wrong, you can rollback using these steps:
-- 
-- BEGIN;
-- 
-- -- Restore the trigger function to use old table
-- CREATE OR REPLACE FUNCTION public.handle_new_user_routing()
-- RETURNS TRIGGER 
-- LANGUAGE plpgsql 
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--   -- Check the account type and call the appropriate handler with the NEW record
--   IF NEW.raw_user_meta_data->>'account_type' = 'buyer' THEN
--     INSERT INTO public.user_buyers (...) VALUES (...);
--   ELSIF NEW.raw_user_meta_data->>'account_type' = 'ip_owner' THEN
--     INSERT INTO public.user_ipowners (...) VALUES (...);  -- Back to old table
--   END IF;
--   RETURN NEW;
-- END;
-- $$;
-- 
-- -- Drop the new table
-- DROP TABLE IF EXISTS public.user_creators CASCADE;
-- 
-- COMMIT;

-- ============================================
-- POST-MIGRATION NOTES
-- ============================================
-- After running this migration successfully:
-- 
-- 1. ✅ Code has been updated to use 'user_creators'
-- 2. ✅ Database migration completed
-- 3. 🔄 Test all creator signup/signin flows
-- 4. 🔄 Test route protection for creators
-- 5. 🔄 Test profile management
-- 6. 🔄 Monitor application logs
-- 7. 🔄 After 1 week of stable operation, drop old table
-- 
-- Both tables will exist temporarily to ensure safe migration!
