-- Migration: Add slug column to titles + anonymous SELECT policy
-- Purpose: Enable public title pages for newsletter funnel (logged-out users)

-- 1. Add slug column
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Create slug generation function (adapted from intelligence schema)
CREATE OR REPLACE FUNCTION generate_title_slug(title_en TEXT, title_kr TEXT)
RETURNS TEXT AS $$
DECLARE
  base_title TEXT;
  result_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Prefer English title for slug, fallback to Korean
  base_title := COALESCE(title_en, title_kr);

  IF base_title IS NULL THEN
    RETURN 'untitled-' || gen_random_uuid()::text;
  END IF;

  -- Generate slug: lowercase, replace spaces with hyphens, remove special chars
  result_slug := regexp_replace(
    lower(trim(base_title)),
    '[^a-z0-9\s-]',
    '',
    'g'
  );
  result_slug := regexp_replace(result_slug, '\s+', '-', 'g');
  result_slug := regexp_replace(result_slug, '-+', '-', 'g');
  result_slug := trim(both '-' from result_slug);

  -- Handle empty slug after sanitization
  IF result_slug = '' OR result_slug IS NULL THEN
    RETURN 'untitled-' || gen_random_uuid()::text;
  END IF;

  -- Ensure uniqueness against titles table
  IF NOT EXISTS (SELECT 1 FROM public.titles t WHERE t.slug = result_slug) THEN
    RETURN result_slug;
  END IF;

  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.titles t WHERE t.slug = result_slug || '-' || counter::text
    );
    counter := counter + 1;
  END LOOP;

  RETURN result_slug || '-' || counter::text;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_title_slug IS 'Generate unique URL-friendly slug from title name';

-- 3. Backfill all existing titles
UPDATE public.titles
SET slug = generate_title_slug(title_name_en, title_name_kr)
WHERE slug IS NULL;

-- 4. Trigger: auto-generate slug on INSERT if not provided
CREATE OR REPLACE FUNCTION set_title_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_title_slug(NEW.title_name_en, NEW.title_name_kr);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_title_slug
  BEFORE INSERT ON public.titles
  FOR EACH ROW
  EXECUTE FUNCTION set_title_slug();

-- 5. Make slug NOT NULL now that all rows are backfilled
ALTER TABLE public.titles ALTER COLUMN slug SET NOT NULL;

-- 6. Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_titles_slug ON public.titles(slug);

-- 7. Create a view with only public-safe columns (no creator_id, pitch, embeddings, etc.)
CREATE OR REPLACE VIEW public.public_titles AS
SELECT
  title_id, title_name_en, title_name_kr, slug, title_image, tagline,
  synopsis, genre, content_format, comps, views, rating, rating_count,
  chapters, completed, rights_available, note, story_author, art_author,
  tone, audience, age_rating
FROM public.titles;

-- 8. Grant anon + authenticated access to the view (not the raw table)
GRANT SELECT ON public.public_titles TO anon;
GRANT SELECT ON public.public_titles TO authenticated;
