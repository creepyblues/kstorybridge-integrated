-- Migration: Prevent duplicate titles per creator + update slug on title rename
-- Purpose: Prevent accidental duplicate title creation + keep slugs in sync with names

-- 1. Unique index: prevent same creator from inserting a title with identical EN+KR name pair
--    Uses lower(trim(...)) for case-insensitive, whitespace-normalized matching
--    Excludes NULL/empty names to avoid false positives
--    Different creators CAN have same-named titles (scoped by creator_id)
--    A creator CAN have multiple titles with same EN name if KR names differ (e.g., "Never Mind Darling")

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_title_names_per_creator
  ON public.titles (
    lower(trim(COALESCE(title_name_en, ''))),
    lower(trim(COALESCE(title_name_kr, ''))),
    creator_id
  )
  WHERE COALESCE(NULLIF(title_name_en, ''), NULLIF(title_name_kr, '')) IS NOT NULL;

-- 2. Update slug trigger to also fire on UPDATE (previously INSERT-only)
--    When title_name_en or title_name_kr changes, regenerate the slug
--    Uses IS DISTINCT FROM to handle NULL transitions correctly

CREATE OR REPLACE FUNCTION set_title_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NULL THEN
      NEW.slug := generate_title_slug(NEW.title_name_en, NEW.title_name_kr);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.title_name_en IS DISTINCT FROM NEW.title_name_en)
       OR (OLD.title_name_kr IS DISTINCT FROM NEW.title_name_kr) THEN
      NEW.slug := generate_title_slug(NEW.title_name_en, NEW.title_name_kr);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_title_slug ON public.titles;

CREATE TRIGGER trigger_set_title_slug
  BEFORE INSERT OR UPDATE ON public.titles
  FOR EACH ROW
  EXECUTE FUNCTION set_title_slug();
