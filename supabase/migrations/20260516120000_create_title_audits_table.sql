-- =============================================================================
-- Migration: Create title_audits table
-- Created: 2026-05-16
-- Purpose: Persist results of admin "Run Audit" runs against the titles table.
--          Each row stores what we scraped from the source URL and how it
--          compares to the values we already have in `titles`.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.title_audits (
  title_id uuid PRIMARY KEY REFERENCES public.titles(title_id) ON DELETE CASCADE,
  last_audited_at timestamp with time zone NOT NULL DEFAULT now(),

  -- What we pulled off the source page (raw, pre-comparison)
  title_name_kr_scraped text,
  title_name_en_scraped text,
  title_image_scraped text,

  -- Similarity scores (Jaro-Winkler, 0..1) and boolean match flags
  -- name_match_* is true when similarity >= 0.85 after normalization.
  -- image_match is conservative: true only when scraped URL and stored URL
  -- share the same hostname + path. Anything else stays null; admin reviews.
  name_similarity_kr numeric(4,3),
  name_similarity_en numeric(4,3),
  name_match_kr boolean,
  name_match_en boolean,
  image_match boolean,
  image_reachable boolean,

  -- Diagnostics
  scrape_error text,
  scraped_at_kr timestamp with time zone,
  scraped_at_en timestamp with time zone,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.title_audits IS 'Admin audit run results: scraped name/image from the source URL and comparison flags vs. the stored values on titles.';
COMMENT ON COLUMN public.title_audits.name_match_kr IS 'true when Jaro-Winkler(normalized scraped vs stored KR name) >= 0.85';
COMMENT ON COLUMN public.title_audits.image_match IS 'true only when scraped image URL and stored title_image share hostname+path; null when uncertain';
COMMENT ON COLUMN public.title_audits.image_reachable IS 'HEAD request on the stored title_image returned 2xx';

CREATE INDEX IF NOT EXISTS idx_title_audits_last_audited_at
  ON public.title_audits(last_audited_at DESC);

CREATE INDEX IF NOT EXISTS idx_title_audits_name_match_kr
  ON public.title_audits(name_match_kr) WHERE name_match_kr = false;

CREATE INDEX IF NOT EXISTS idx_title_audits_image_reachable
  ON public.title_audits(image_reachable) WHERE image_reachable = false;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_title_audits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_title_audits_updated_at ON public.title_audits;
CREATE TRIGGER trigger_title_audits_updated_at
  BEFORE UPDATE ON public.title_audits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_title_audits_updated_at();

-- RLS: anyone authenticated can read (admins use this in the dashboard);
-- only service role mutates (writes come from the audit-title edge function).
ALTER TABLE public.title_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read title audits"
  ON public.title_audits
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert title audits"
  ON public.title_audits
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update title audits"
  ON public.title_audits
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete title audits"
  ON public.title_audits
  FOR DELETE
  USING (auth.role() = 'service_role');

-- =============================================================================
-- End of Migration
-- =============================================================================
