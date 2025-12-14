-- =============================================================================
-- Migration: Add Format Fit Analysis Table
-- Created: 2025-12-11
-- Purpose: Store AI-generated format fit scores for 5 content formats
--          (Film, TV Series, Animation, Microdrama, Audio Drama)
-- =============================================================================

-- Create the title_format_fit table
CREATE TABLE IF NOT EXISTS public.title_format_fit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL UNIQUE REFERENCES public.titles(title_id) ON DELETE CASCADE,

  -- Overall scores (0-100) for each format
  film_score integer DEFAULT 0 CHECK (film_score >= 0 AND film_score <= 100),
  tv_series_score integer DEFAULT 0 CHECK (tv_series_score >= 0 AND tv_series_score <= 100),
  animation_score integer DEFAULT 0 CHECK (animation_score >= 0 AND animation_score <= 100),
  microdrama_score integer DEFAULT 0 CHECK (microdrama_score >= 0 AND microdrama_score <= 100),
  audio_drama_score integer DEFAULT 0 CHECK (audio_drama_score >= 0 AND audio_drama_score <= 100),

  -- Detailed analysis JSONB for each format
  -- Structure: { overall_score, fit_level, summary, dimensions[], strengths[], challenges[], recommendations[] }
  film_analysis jsonb DEFAULT '{}'::jsonb,
  tv_series_analysis jsonb DEFAULT '{}'::jsonb,
  animation_analysis jsonb DEFAULT '{}'::jsonb,
  microdrama_analysis jsonb DEFAULT '{}'::jsonb,
  audio_drama_analysis jsonb DEFAULT '{}'::jsonb,

  -- Shared story deconstruction (reused from comps engine pattern)
  story_deconstruction jsonb DEFAULT '{}'::jsonb,

  -- Data completeness score (0-100)
  data_completeness integer DEFAULT 0 CHECK (data_completeness >= 0 AND data_completeness <= 100),

  -- Analysis mode used
  mode_used text DEFAULT 'auto' CHECK (mode_used IN ('rich', 'limited', 'auto')),

  -- Metadata
  analysis_version text DEFAULT '1.0',
  processing_time_ms integer,
  cost_estimate numeric(6,4),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.title_format_fit IS 'AI-generated format fit analysis for 5 content formats: Film, TV Series, Animation, Microdrama, Audio Drama';

-- Add column comments
COMMENT ON COLUMN public.title_format_fit.film_score IS 'Overall fit score (0-100) for Film adaptation';
COMMENT ON COLUMN public.title_format_fit.tv_series_score IS 'Overall fit score (0-100) for TV Series adaptation';
COMMENT ON COLUMN public.title_format_fit.animation_score IS 'Overall fit score (0-100) for Animation adaptation';
COMMENT ON COLUMN public.title_format_fit.microdrama_score IS 'Overall fit score (0-100) for Microdrama (ReelShort/DramaBox) adaptation';
COMMENT ON COLUMN public.title_format_fit.audio_drama_score IS 'Overall fit score (0-100) for Audio Drama (podcast) adaptation';
COMMENT ON COLUMN public.title_format_fit.story_deconstruction IS 'Shared story analysis: save_the_cat_genre, tone_mood, character_archetypes, plot_structure, setting_world, themes, target_audience, format_style';
COMMENT ON COLUMN public.title_format_fit.data_completeness IS 'Percentage of available title data used in analysis';

-- Create indexes for efficient filtering by format score
CREATE INDEX IF NOT EXISTS idx_format_fit_film ON public.title_format_fit(film_score DESC);
CREATE INDEX IF NOT EXISTS idx_format_fit_tv ON public.title_format_fit(tv_series_score DESC);
CREATE INDEX IF NOT EXISTS idx_format_fit_animation ON public.title_format_fit(animation_score DESC);
CREATE INDEX IF NOT EXISTS idx_format_fit_microdrama ON public.title_format_fit(microdrama_score DESC);
CREATE INDEX IF NOT EXISTS idx_format_fit_audio ON public.title_format_fit(audio_drama_score DESC);

-- Create index for title_id lookups
CREATE INDEX IF NOT EXISTS idx_format_fit_title_id ON public.title_format_fit(title_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_format_fit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_format_fit_updated_at ON public.title_format_fit;
CREATE TRIGGER trigger_format_fit_updated_at
  BEFORE UPDATE ON public.title_format_fit
  FOR EACH ROW
  EXECUTE FUNCTION public.update_format_fit_updated_at();

-- Enable RLS
ALTER TABLE public.title_format_fit ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can read, service role can manage
CREATE POLICY "Anyone can read format fit data"
  ON public.title_format_fit
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert format fit"
  ON public.title_format_fit
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update format fit"
  ON public.title_format_fit
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete format fit"
  ON public.title_format_fit
  FOR DELETE
  USING (auth.role() = 'service_role');

-- =============================================================================
-- End of Migration
-- =============================================================================
