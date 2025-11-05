-- Migration: Add admin access policies to title_drafts table
-- Purpose: Allow admin users to view and manage all drafts for approval workflow
-- Created: 2025-11-04
-- Status: IN_PROGRESS

-- Add admin access policy for SELECT operations
-- This allows admins to view all drafts regardless of creator_id
CREATE POLICY "Admins can view all drafts"
ON public.title_drafts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.admin
    WHERE admin.email = auth.email()
    AND admin.active = true
  )
);

-- Add admin access policy for UPDATE operations
-- This allows admins to approve/reject drafts (update status fields)
CREATE POLICY "Admins can update draft status"
ON public.title_drafts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.admin
    WHERE admin.email = auth.email()
    AND admin.active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin
    WHERE admin.email = auth.email()
    AND admin.active = true
  )
);

-- Add helpful comments for documentation
COMMENT ON POLICY "Admins can view all drafts" ON public.title_drafts
IS 'Allows users in admin table with active=true to SELECT all drafts for approval workflow. Does not interfere with creator-specific policy.';

COMMENT ON POLICY "Admins can update draft status" ON public.title_drafts
IS 'Allows users in admin table with active=true to UPDATE drafts (approve/reject operations). Checks both USING and WITH CHECK for security.';

-- Migration Notes:
-- 1. This adds ADDITIONAL policies, does not replace existing "Creators manage their own drafts" policy
-- 2. RLS evaluates policies with OR logic, so both creator AND admin policies apply
-- 3. Requires admin table to exist with email and active columns
-- 4. Uses auth.email() function which returns lowercase email from JWT token
-- 5. Test with: SELECT * FROM title_drafts; (as admin user)
