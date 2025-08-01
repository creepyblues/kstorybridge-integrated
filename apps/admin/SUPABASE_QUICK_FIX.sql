-- ============================================
-- QUICK FIX FOR ADMIN APP 401 ERRORS
-- ============================================
-- This is the simplest possible fix - run this immediately

-- Step 1: Drop all policies on admin table
DROP POLICY IF EXISTS "admin_select_all" ON public.admin;
DROP POLICY IF EXISTS "Allow admin status verification" ON public.admin;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin;
DROP POLICY IF EXISTS "Admins can view admin records" ON public.admin;
DROP POLICY IF EXISTS "Authenticated users can view admin records" ON public.admin;
DROP POLICY IF EXISTS "Users can view their own admin record" ON public.admin;

-- Step 2: Drop all policies on titles table  
DROP POLICY IF EXISTS "titles_select_all" ON public.titles;
DROP POLICY IF EXISTS "Allow basic titles access" ON public.titles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.titles;

-- Step 3: Create simple permissive policies
CREATE POLICY "admin_full_select" ON public.admin FOR SELECT USING (true);
CREATE POLICY "titles_full_select" ON public.titles FOR SELECT USING (true);

-- Step 4: Grant permissions explicitly
GRANT SELECT ON public.admin TO anon, authenticated;
GRANT SELECT ON public.titles TO anon, authenticated;

-- Step 5: Test the queries
SELECT 'Testing after fix:' as result;
SELECT COUNT(*) as admin_records FROM public.admin;
SELECT COUNT(*) as title_records FROM public.titles;
SELECT email FROM public.admin LIMIT 1;
SELECT title_id FROM public.titles LIMIT 1;