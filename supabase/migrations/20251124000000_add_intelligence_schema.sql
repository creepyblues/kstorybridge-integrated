/**
 * Title Intelligence System - Database Schema
 *
 * Purpose: Create separate intelligence schema for discovered/scraped titles
 *
 * This schema is SEPARATE from the creator-submitted `titles` table.
 * It allows us to:
 * - Store discovered titles from web scraping
 * - Track metrics over time (snapshots)
 * - Manage alternative titles/aliases
 * - Link multiple sources per title
 * - Eventually map to creator-submitted titles via bridge table
 *
 * Created: 2025-11-24
 * Status: PENDING
 */

-- ============================================================================
-- 1. Intelligence Titles Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_title_ko text,
  original_title_en text,
  slug text UNIQUE NOT NULL,  -- URL-friendly identifier (e.g., "sajangnim-eun-two-time")
  type text CHECK (type IN ('webtoon', 'webnovel', 'light_novel', 'manga', 'mixed')),
  original_language text,  -- ISO 639-1 code (ko, en, ja, zh)
  primary_genres jsonb DEFAULT '[]'::jsonb,  -- Array of genre strings
  demographic text,  -- shounen, shoujo, seinen, josei, general
  has_webnovel boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_intelligence_titles_slug ON intelligence_titles(slug);
CREATE INDEX IF NOT EXISTS idx_intelligence_titles_type ON intelligence_titles(type);
CREATE INDEX IF NOT EXISTS idx_intelligence_titles_created_at ON intelligence_titles(created_at DESC);

-- Full-text search on titles (Korean + English)
CREATE INDEX IF NOT EXISTS idx_intelligence_titles_search ON intelligence_titles
USING gin(to_tsvector('simple', coalesce(original_title_ko, '') || ' ' || coalesce(original_title_en, '')));

COMMENT ON TABLE intelligence_titles IS 'Discovered/scraped titles (separate from creator-submitted titles table)';
COMMENT ON COLUMN intelligence_titles.slug IS 'URL-friendly unique identifier for SEO and routing';
COMMENT ON COLUMN intelligence_titles.type IS 'Primary content format of the IP';
COMMENT ON COLUMN intelligence_titles.has_webnovel IS 'Whether this IP has an underlying web novel source';

-- ============================================================================
-- 2. Intelligence Aliases Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_title_id uuid NOT NULL REFERENCES intelligence_titles(id) ON DELETE CASCADE,
  alias text NOT NULL,
  language text NOT NULL,  -- ko, en, ja, zh, romanization
  kind text CHECK (kind IN ('en_official', 'en_fan', 'romanization', 'ko_variant', 'other')),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intelligence_aliases_title ON intelligence_aliases(intelligence_title_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_aliases_alias ON intelligence_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_intelligence_aliases_language ON intelligence_aliases(language);

-- Full-text search on aliases
CREATE INDEX IF NOT EXISTS idx_intelligence_aliases_search ON intelligence_aliases
USING gin(to_tsvector('simple', alias));

COMMENT ON TABLE intelligence_aliases IS 'Alternative titles, translations, and romanizations for intelligence_titles';
COMMENT ON COLUMN intelligence_aliases.kind IS 'Type of alias: official EN title, fan translation, romanization, Korean variant, etc.';

-- ============================================================================
-- 3. Intelligence Sources Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_title_id uuid NOT NULL REFERENCES intelligence_titles(id) ON DELETE CASCADE,
  domain text NOT NULL,  -- page.kakao.com, series.naver.com, webtoons.com, etc.
  category text NOT NULL CHECK (category IN (
    'official_platform',
    'official_platform_en',
    'metadata_db',
    'fandom_forum',
    'unofficial_aggregator',
    'fanfiction',
    'news_media'
  )),
  url text NOT NULL,
  region text,  -- KR, Global, US, JP, etc.
  language text,  -- ko, en, ja, etc.
  raw_meta jsonb DEFAULT '{}'::jsonb,  -- Full scrape result
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(intelligence_title_id, url)  -- Prevent duplicate URLs per title
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intelligence_sources_title ON intelligence_sources(intelligence_title_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_sources_domain ON intelligence_sources(domain);
CREATE INDEX IF NOT EXISTS idx_intelligence_sources_category ON intelligence_sources(category);
CREATE INDEX IF NOT EXISTS idx_intelligence_sources_url ON intelligence_sources(url);

COMMENT ON TABLE intelligence_sources IS 'Source URLs discovered for each intelligence title (one row per platform)';
COMMENT ON COLUMN intelligence_sources.category IS 'Source type: official platform, metadata DB, fandom, etc.';
COMMENT ON COLUMN intelligence_sources.raw_meta IS 'Full raw scrape result stored as JSONB for debugging and re-processing';

-- ============================================================================
-- 4. Intelligence Metrics Table (Time-Series)
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_title_id uuid NOT NULL REFERENCES intelligence_titles(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES intelligence_sources(id) ON DELETE CASCADE,
  snapshot_time timestamptz DEFAULT now(),
  views bigint,
  subscribers bigint,
  rating_score numeric(3, 1),  -- 0.0 to 10.0 scale
  rating_votes integer,
  favorites bigint,
  episode_count integer,
  status text CHECK (status IN ('ongoing', 'completed', 'hiatus', 'cancelled', 'upcoming')),
  age_rating text,
  raw jsonb DEFAULT '{}'::jsonb  -- Extra metrics per site (comments, likes, trending_rank, etc.)
);

-- Indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_intelligence_metrics_title ON intelligence_metrics(intelligence_title_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_metrics_source ON intelligence_metrics(source_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_metrics_snapshot ON intelligence_metrics(snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_metrics_title_time ON intelligence_metrics(intelligence_title_id, snapshot_time DESC);

COMMENT ON TABLE intelligence_metrics IS 'Time-series metrics snapshots from various sources (one row per scrape)';
COMMENT ON COLUMN intelligence_metrics.snapshot_time IS 'When this data was scraped (allows tracking metrics over time)';
COMMENT ON COLUMN intelligence_metrics.raw IS 'Additional platform-specific metrics (comments, likes, trending rank, etc.)';

-- ============================================================================
-- 5. Title Intelligence Mapping (Bridge Table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS title_intelligence_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  intelligence_title_id uuid NOT NULL REFERENCES intelligence_titles(id) ON DELETE CASCADE,
  mapped_by text NOT NULL,  -- Admin email who created the mapping
  mapped_at timestamptz DEFAULT now(),
  mapping_confidence text DEFAULT 'manual' CHECK (mapping_confidence IN ('manual', 'auto_high', 'auto_low')),
  UNIQUE(title_id, intelligence_title_id)  -- One-to-one mapping
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_title_intelligence_mapping_title ON title_intelligence_mapping(title_id);
CREATE INDEX IF NOT EXISTS idx_title_intelligence_mapping_intelligence ON title_intelligence_mapping(intelligence_title_id);

COMMENT ON TABLE title_intelligence_mapping IS 'Bridge table linking creator-submitted titles to intelligence-discovered titles';
COMMENT ON COLUMN title_intelligence_mapping.mapping_confidence IS 'Confidence level: manual (admin verified), auto_high (strong match), auto_low (fuzzy match)';

-- ============================================================================
-- 6. Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE intelligence_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_intelligence_mapping ENABLE ROW LEVEL SECURITY;

-- Admin-only access for all tables (consistent with existing title_intelligence_data)
-- SELECT policy
CREATE POLICY "Admin can view all intelligence titles"
  ON intelligence_titles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

CREATE POLICY "Admin can view all intelligence aliases"
  ON intelligence_aliases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

CREATE POLICY "Admin can view all intelligence sources"
  ON intelligence_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

CREATE POLICY "Admin can view all intelligence metrics"
  ON intelligence_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

CREATE POLICY "Admin can view all title intelligence mappings"
  ON title_intelligence_mapping FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

-- INSERT policy
CREATE POLICY "Admin can insert intelligence titles"
  ON intelligence_titles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

CREATE POLICY "Admin can insert intelligence aliases"
  ON intelligence_aliases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

CREATE POLICY "Admin can insert intelligence sources"
  ON intelligence_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

CREATE POLICY "Admin can insert intelligence metrics"
  ON intelligence_metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

CREATE POLICY "Admin can insert title intelligence mappings"
  ON title_intelligence_mapping FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

-- UPDATE policy
CREATE POLICY "Admin can update intelligence titles"
  ON intelligence_titles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

CREATE POLICY "Admin can update intelligence sources"
  ON intelligence_sources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

-- DELETE policy (rare, but allowed for data cleanup)
CREATE POLICY "Admin can delete intelligence titles"
  ON intelligence_titles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = auth.jwt() ->> 'email'
      AND admin.active = true
    )
  );

-- ============================================================================
-- 7. Helper Functions
-- ============================================================================

-- Function: Generate slug from title (Korean or English)
CREATE OR REPLACE FUNCTION generate_intelligence_slug(title_ko text, title_en text)
RETURNS text AS $$
DECLARE
  base_title text;
  slug text;
  counter integer := 1;
BEGIN
  -- Prefer English title for slug, fallback to Korean romanization
  base_title := COALESCE(title_en, title_ko);

  IF base_title IS NULL THEN
    RETURN 'untitled-' || gen_random_uuid()::text;
  END IF;

  -- Generate slug: lowercase, replace spaces with hyphens, remove special chars
  slug := regexp_replace(
    lower(trim(base_title)),
    '[^a-z0-9\s-]',
    '',
    'g'
  );
  slug := regexp_replace(slug, '\s+', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM intelligence_titles WHERE intelligence_titles.slug = slug) LOOP
    slug := regexp_replace(slug, '-\d+$', '', 'g') || '-' || counter::text;
    counter := counter + 1;
  END LOOP;

  RETURN slug;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_intelligence_slug IS 'Generate unique URL-friendly slug from title';

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on intelligence_titles
CREATE TRIGGER update_intelligence_titles_updated_at
  BEFORE UPDATE ON intelligence_titles
  FOR EACH ROW
  EXECUTE FUNCTION update_intelligence_updated_at();

-- Trigger: Auto-update updated_at on intelligence_sources
CREATE TRIGGER update_intelligence_sources_updated_at
  BEFORE UPDATE ON intelligence_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_intelligence_updated_at();

-- ============================================================================
-- End of Migration
-- ============================================================================
