-- Migration: Create storage bucket for CMS content images
-- Purpose: Store featured images and inline images for blog posts
-- Risk Level: LOW (new bucket, no impact on existing storage)
-- Status: IN_PROGRESS

-- ============================================================================
-- STORAGE BUCKET: content-posts-images
-- ============================================================================
-- Public bucket for blog post images (featured images and inline content images)
-- File size limit: 5MB per image
-- Allowed types: PNG, JPEG, WebP, GIF

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-posts-images',
  'content-posts-images',
  true,  -- Public bucket (images need to be accessible without auth)
  5242880,  -- 5MB file size limit (5 * 1024 * 1024 bytes)
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;  -- Prevent error if bucket already exists

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR STORAGE
-- ============================================================================

-- Policy 1: Admins can upload images
-- Pattern: Follows existing storage RLS patterns from title-documents
CREATE POLICY "Admins can upload content images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'content-posts-images' AND
    (auth.jwt() ->> 'email') IN (
      'sungho@dadble.com',
      'kevin@sandstoneartists.com'
    )
  );

-- Policy 2: Admins can update their uploaded images
CREATE POLICY "Admins can update content images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'content-posts-images' AND
    (auth.jwt() ->> 'email') IN (
      'sungho@dadble.com',
      'kevin@sandstoneartists.com'
    )
  )
  WITH CHECK (
    bucket_id = 'content-posts-images' AND
    (auth.jwt() ->> 'email') IN (
      'sungho@dadble.com',
      'kevin@sandstoneartists.com'
    )
  );

-- Policy 3: Admins can delete images
CREATE POLICY "Admins can delete content images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'content-posts-images' AND
    (auth.jwt() ->> 'email') IN (
      'sungho@dadble.com',
      'kevin@sandstoneartists.com'
    )
  );

-- Policy 4: Everyone can view images (public bucket)
-- Note: This policy is technically redundant since bucket.public = true,
-- but included for explicitness and consistency
CREATE POLICY "Anyone can view content images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'content-posts-images');
