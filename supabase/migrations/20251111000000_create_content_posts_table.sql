-- Migration: Create content_posts table for CMS
-- Purpose: Simple CMS for Learning Center and News sections
-- Risk Level: LOW (non-destructive, new table, no dependencies)
-- Status: IN_PROGRESS

-- ============================================================================
-- TABLE: content_posts
-- ============================================================================
-- Stores blog posts, learning materials, and news articles for the platform
-- Admin-only write access, public read access for published content
-- Pattern: Follows title_marketing_assets design (isolated, no foreign keys)

CREATE TABLE IF NOT EXISTS content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content fields
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- URL-friendly identifier (auto-generated from title)
  excerpt TEXT,  -- Short description for card previews
  content TEXT NOT NULL,  -- Full HTML content from TipTap editor
  featured_image_url TEXT,  -- Main image for card display

  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('learning', 'news')),
  tags TEXT[] DEFAULT '{}',  -- Array of tags for filtering/search

  -- Authoring (stored directly for isolation)
  author_email TEXT NOT NULL,
  author_name TEXT NOT NULL,

  -- Publishing workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,  -- Set when status changes to 'published'

  -- SEO metadata (optional)
  meta_description TEXT,
  meta_keywords TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Optimize common query patterns

-- Unique slug for URL routing
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_posts_slug ON content_posts(slug);

-- Filter by category and status (most common query)
CREATE INDEX IF NOT EXISTS idx_content_posts_category_status ON content_posts(category, status);

-- Order by published date for news feed
CREATE INDEX IF NOT EXISTS idx_content_posts_published_at ON content_posts(published_at DESC) WHERE status = 'published';

-- Search by tags
CREATE INDEX IF NOT EXISTS idx_content_posts_tags ON content_posts USING GIN(tags);

-- Filter by author
CREATE INDEX IF NOT EXISTS idx_content_posts_author_email ON content_posts(author_email);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins can manage all posts (CRUD operations)
-- Uses hardcoded email list pattern from title_marketing_assets
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

-- Policy 2: Published posts are viewable by everyone (including anonymous)
CREATE POLICY "Published posts are viewable by all"
  ON content_posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_content_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_posts_updated_at
  BEFORE UPDATE ON content_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_content_posts_updated_at();

-- ============================================================================
-- TRIGGER: Auto-set published_at when status changes to 'published'
-- ============================================================================
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is changing to 'published' and published_at is NULL, set it
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;

  -- If status is changing from 'published' to something else, clear published_at
  IF NEW.status != 'published' AND OLD.status = 'published' THEN
    NEW.published_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_published_at
  BEFORE UPDATE ON content_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_published_at();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================
COMMENT ON TABLE content_posts IS 'CMS content for Learning Center and News sections. Admin-only write access.';
COMMENT ON COLUMN content_posts.slug IS 'URL-friendly identifier, must be unique. Auto-generated from title in application.';
COMMENT ON COLUMN content_posts.content IS 'Rich HTML content from TipTap editor. Supports text formatting, images, videos.';
COMMENT ON COLUMN content_posts.category IS 'Content type: learning (tutorials, guides) or news (updates, announcements).';
COMMENT ON COLUMN content_posts.status IS 'Publishing workflow: draft → published → archived.';
COMMENT ON COLUMN content_posts.featured_image_url IS 'Main image displayed in card previews. Should be stored in content-posts-images bucket.';
