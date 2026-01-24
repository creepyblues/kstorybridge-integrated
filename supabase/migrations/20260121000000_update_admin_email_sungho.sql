-- =============================================================================
-- Migration: Update Admin Email in RLS Policies
-- Description: Replace sungho@dadble.com with sungho@kstorybridge.com in all RLS policies
-- Date: 2026-01-21
-- Risk Level: LOW (only updates policy text, no data modification)
-- Status: IN_PROGRESS
-- =============================================================================
--
-- CONTEXT:
-- The admin email sungho@dadble.com needs to be updated to sungho@kstorybridge.com
-- across all RLS policies in the database. This migration updates the live policies
-- to match the updated migration files.
--
-- AFFECTED TABLES:
-- - content_posts (table + policies)
-- - title_marketing_assets (table + policies)
-- - storage.objects (policies for marketing-assets and content-posts-images buckets)
--
-- =============================================================================

-- =============================================================================
-- SECTION 1: UPDATE content_posts RLS POLICIES
-- =============================================================================

-- Drop and recreate the admin management policy
DROP POLICY IF EXISTS "Admins can manage content posts" ON content_posts;

CREATE POLICY "Admins can manage content posts"
  ON content_posts
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

-- =============================================================================
-- SECTION 2: UPDATE title_marketing_assets RLS POLICIES
-- =============================================================================

-- Drop and recreate all policies
DROP POLICY IF EXISTS "Admins can view all marketing assets" ON title_marketing_assets;
DROP POLICY IF EXISTS "Admins can insert marketing assets" ON title_marketing_assets;
DROP POLICY IF EXISTS "Admins can update marketing assets" ON title_marketing_assets;
DROP POLICY IF EXISTS "Admins can delete marketing assets" ON title_marketing_assets;

CREATE POLICY "Admins can view all marketing assets"
  ON title_marketing_assets
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

CREATE POLICY "Admins can insert marketing assets"
  ON title_marketing_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

CREATE POLICY "Admins can update marketing assets"
  ON title_marketing_assets
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

CREATE POLICY "Admins can delete marketing assets"
  ON title_marketing_assets
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

-- =============================================================================
-- SECTION 3: UPDATE storage.objects RLS POLICIES (marketing-assets bucket)
-- =============================================================================

-- Drop and recreate policies for marketing-assets bucket
DROP POLICY IF EXISTS "Admins can view marketing assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload marketing assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update marketing assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete marketing assets" ON storage.objects;

CREATE POLICY "Admins can view marketing assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'marketing-assets'
    AND (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

CREATE POLICY "Admins can upload marketing assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'marketing-assets'
    AND (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

CREATE POLICY "Admins can update marketing assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'marketing-assets'
    AND (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  )
  WITH CHECK (
    bucket_id = 'marketing-assets'
    AND (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

CREATE POLICY "Admins can delete marketing assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'marketing-assets'
    AND (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

-- =============================================================================
-- SECTION 4: UPDATE storage.objects RLS POLICIES (content-posts-images bucket)
-- =============================================================================

-- Drop and recreate policies for content-posts-images bucket
DROP POLICY IF EXISTS "Admins can upload content images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update content images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete content images" ON storage.objects;

CREATE POLICY "Admins can upload content images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'content-posts-images' AND
    (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

CREATE POLICY "Admins can update content images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'content-posts-images' AND
    (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  )
  WITH CHECK (
    bucket_id = 'content-posts-images' AND
    (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

CREATE POLICY "Admins can delete content images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'content-posts-images' AND
    (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After running this migration, verify with:
-- 1. Log in with sungho@kstorybridge.com
-- 2. Test content_posts CRUD operations at /admin/content
-- 3. Test title_marketing_assets operations at /admin/asset-generation
-- 4. Test storage uploads for both buckets
-- =============================================================================
