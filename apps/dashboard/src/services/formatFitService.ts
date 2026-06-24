/**
 * Format Fit Service (Dashboard)
 *
 * Thin wrapper around @kstorybridge/tools that binds the dashboard's Supabase client.
 * This maintains backward compatibility with existing component imports.
 */

import { supabase } from '@/lib/supabase';
import {
  // Service functions (with dependency injection)
  analyzeFormatFit as _analyzeFormatFit,
  getFormatFit as _getFormatFit,
  getFormatFitScores as _getFormatFitScores,
  getFormatFitSummariesForFormat as _getFormatFitSummariesForFormat,
  getTitlesForFormat as _getTitlesForFormat,
  saveFormatFitAnalysis as _saveFormatFitAnalysis,
  deleteFormatFit as _deleteFormatFit,
  // Utility functions (no supabase needed)
  getFitLevel,
  getFitLevelColor,
  getFitLevelBgColor,
  getFitLevelLabel,
  formatFormatFitDimensionName as formatDimensionName,
  getBestFormat,
  // Constants
  FORMAT_DISPLAY_NAMES,
  FORMAT_ICONS,
  FORMAT_DESCRIPTIONS,
  FIT_LEVEL_THRESHOLDS,
  FIT_LEVEL_COLORS,
  FIT_LEVEL_BG_COLORS,
} from '@kstorybridge/tools';

// Re-export types for backward compatibility
export type {
  FormatType,
  FitLevel,
  FormatFitDimension,
  FormatFitScores,
  FormatFitResponse,
  FormatFitRecord,
  FormatAnalysis,
  DimensionScore,
  MicrodramaSpecificInsights,
  StoryDeconstruction,
  FormatFitSummary,
} from '@kstorybridge/tools';

// Re-export utility functions and constants (no supabase needed)
export {
  getFitLevel,
  getFitLevelColor,
  getFitLevelBgColor,
  getFitLevelLabel,
  formatDimensionName,
  getBestFormat,
  FORMAT_DISPLAY_NAMES,
  FORMAT_ICONS,
  FORMAT_DESCRIPTIONS,
  FIT_LEVEL_THRESHOLDS,
  FIT_LEVEL_COLORS,
  FIT_LEVEL_BG_COLORS,
};

// =====================================================================
// BOUND SERVICE FUNCTIONS (dashboard's supabase client)
// =====================================================================

/**
 * Generate format fit analysis for a title
 */
export async function analyzeFormatFit(
  titleId: string,
  userEmail: string,
  mode: 'rich' | 'limited' | 'auto' = 'auto'
) {
  return _analyzeFormatFit(supabase, titleId, userEmail, mode);
}

/**
 * Get existing format fit analysis for a title
 */
export async function getFormatFit(titleId: string) {
  return _getFormatFit(supabase, titleId);
}

/**
 * Get format fit scores for multiple titles (for list views)
 */
export async function getFormatFitScores(titleIds: string[]) {
  return _getFormatFitScores(supabase, titleIds);
}

/**
 * Get format fit summaries for multiple titles
 */
export async function getFormatFitSummariesForFormat(
  titleIds: string[],
  format: import('@kstorybridge/tools').FormatType
) {
  return _getFormatFitSummariesForFormat(supabase, titleIds, format);
}

/**
 * Search titles by format fit score
 */
export async function getTitlesForFormat(
  format: import('@kstorybridge/tools').FormatType,
  minScore: number = 60,
  limit: number = 30
) {
  return _getTitlesForFormat(supabase, format, minScore, limit);
}

/**
 * Save format fit analysis to database
 */
export async function saveFormatFitAnalysis(
  titleId: string,
  response: import('@kstorybridge/tools').FormatFitResponse
) {
  return _saveFormatFitAnalysis(supabase, titleId, response);
}

/**
 * Delete format fit analysis for a title
 */
export async function deleteFormatFit(titleId: string) {
  return _deleteFormatFit(supabase, titleId);
}

// =====================================================================
// FORMAT SPOTLIGHT DATA
// =====================================================================

interface SpotlightTitleData {
  title_id: string;
  slug?: string | null;
  title_name_en: string | null;
  title_name_kr: string | null;
  title_image: string | null;
  synopsis: string | null;
  genre: string[] | null;
  content_format: string | null;
  tone: string | null;
  story_author: string | null;
  art_author: string | null;
  rating: number | null;
  views: number | null;
}

interface SpotlightItem {
  title: SpotlightTitleData;
  analysis: import('@kstorybridge/tools').FormatAnalysis;
  // Admin editorial note (only set on the curated microdrama path).
  note?: string | null;
}

/**
 * Get format spotlight data: titles joined with format fit analysis,
 * filtered by minimum score and sorted descending.
 */
export async function getFormatSpotlightData(
  formatType: import('@kstorybridge/tools').FormatType,
  minScore: number = 50
): Promise<SpotlightItem[]> {
  const scoreKey = `${formatType}_score`;
  const analysisKey = `${formatType}_analysis`;

  // Fetch all format fit records with scores and analyses
  const { data: fitData, error: fitError } = await supabase
    .from('title_format_fit')
    .select('title_id, film_score, tv_series_score, animation_score, microdrama_score, audio_drama_score, film_analysis, tv_series_analysis, animation_analysis, microdrama_analysis, audio_drama_analysis');

  if (fitError) {
    console.error('[FormatSpotlight] Fetch error:', fitError);
    throw new Error('Failed to fetch format spotlight data');
  }

  // Filter and sort by the target format score
  const filtered = (fitData || [])
    .filter((row) => {
      const score = (row as Record<string, unknown>)[scoreKey] as number | null;
      return score !== null && score >= minScore;
    })
    .sort((a, b) => {
      const scoreA = ((a as Record<string, unknown>)[scoreKey] as number) || 0;
      const scoreB = ((b as Record<string, unknown>)[scoreKey] as number) || 0;
      return scoreB - scoreA;
    });

  if (filtered.length === 0) return [];

  // Fetch title details for matching titles. Format Spotlight is buyer-facing,
  // so hide Low-priority (priority='3'/null) titles.
  const titleIds = filtered.map((r) => r.title_id);
  const { data: titles, error: titlesError } = await supabase
    .from('titles')
    .select('title_id, slug, title_name_en, title_name_kr, title_image, synopsis, genre, content_format, tone, story_author, art_author, rating, views')
    .in('title_id', titleIds)
    .in('priority', ['1', '2']);

  if (titlesError) {
    console.error('[FormatSpotlight] Titles fetch error:', titlesError);
    throw new Error('Failed to fetch title details');
  }

  const titlesMap = new Map((titles || []).map((t) => [t.title_id, t]));

  return filtered
    .map((row) => {
      const titleData = titlesMap.get(row.title_id);
      if (!titleData) return null;
      const analysis = (row as Record<string, unknown>)[analysisKey] as import('@kstorybridge/tools').FormatAnalysis;
      if (!analysis) return null;
      return {
        title: titleData as SpotlightTitleData,
        analysis,
      };
    })
    .filter((item): item is SpotlightItem => item !== null);
}

/**
 * Get format spotlight data for admin: same as getFormatSpotlightData but
 * includes all priority levels (no buyer-side priority filter).
 */
export async function getAdminFormatSpotlightData(
  formatType: import('@kstorybridge/tools').FormatType,
  minScore: number = 50
): Promise<SpotlightItem[]> {
  const scoreKey = `${formatType}_score`;
  const analysisKey = `${formatType}_analysis`;

  const { data: fitData, error: fitError } = await supabase
    .from('title_format_fit')
    .select('title_id, film_score, tv_series_score, animation_score, microdrama_score, audio_drama_score, film_analysis, tv_series_analysis, animation_analysis, microdrama_analysis, audio_drama_analysis');

  if (fitError) {
    console.error('[AdminFormatSpotlight] Fetch error:', fitError);
    throw new Error('Failed to fetch format spotlight data');
  }

  const filtered = (fitData || [])
    .filter((row) => {
      const score = (row as Record<string, unknown>)[scoreKey] as number | null;
      return score !== null && score >= minScore;
    })
    .sort((a, b) => {
      const scoreA = ((a as Record<string, unknown>)[scoreKey] as number) || 0;
      const scoreB = ((b as Record<string, unknown>)[scoreKey] as number) || 0;
      return scoreB - scoreA;
    });

  if (filtered.length === 0) return [];

  const titleIds = filtered.map((r) => r.title_id);
  const { data: titles, error: titlesError } = await supabase
    .from('titles')
    .select('title_id, slug, title_name_en, title_name_kr, title_image, synopsis, genre, content_format, tone, story_author, art_author, rating, views')
    .in('title_id', titleIds);

  if (titlesError) {
    console.error('[AdminFormatSpotlight] Titles fetch error:', titlesError);
    throw new Error('Failed to fetch title details');
  }

  const titlesMap = new Map((titles || []).map((t) => [t.title_id, t]));

  return filtered
    .map((row) => {
      const titleData = titlesMap.get(row.title_id);
      if (!titleData) return null;
      const analysis = (row as Record<string, unknown>)[analysisKey] as import('@kstorybridge/tools').FormatAnalysis;
      if (!analysis) return null;
      return {
        title: titleData as SpotlightTitleData,
        analysis,
      };
    })
    .filter((item): item is SpotlightItem => item !== null);
}

/**
 * Get microdrama spotlight titles curated by admin via the Trending featured section.
 * Finds the first active featured_section whose name contains "microdrama" (case-insensitive),
 * then returns its titles in admin display_order, joined with format-fit analysis.
 *
 * Curated titles that lack microdrama analysis have it auto-generated on demand via
 * analyzeFormatFit (the edge function persists the result, so this is a one-time cost per
 * title). Generation runs in parallel; a title whose generation fails is skipped so the
 * rest still render.
 *
 * @param userEmail - the viewing user's email, required by the format-fit-engine edge function.
 */
export async function getMicrodramaSpotlightFromFeaturedSection(userEmail: string): Promise<SpotlightItem[]> {
  // Find the active microdrama section
  const { data: sections, error: sectionsError } = await supabase
    .from('featured_sections')
    .select('id, name')
    .eq('is_active', true)
    .ilike('name', '%microdrama%')
    .limit(1);

  if (sectionsError) {
    console.error('[MicrodramaSpotlight] Sections fetch error:', sectionsError);
    throw new Error('Failed to fetch microdrama section');
  }

  if (!sections || sections.length === 0) return [];

  const sectionId = sections[0].id;

  // Fetch featured entries for this section with title details.
  // Admin curation overrides the buyer-surface priority gate, so titles of any
  // priority (including Low) appear here when explicitly added to the section.
  const { data: featured, error: featuredError } = await supabase
    .from('featured')
    .select(`
      title_id,
      display_order,
      note,
      titles (
        title_id, slug, title_name_en, title_name_kr, title_image, synopsis,
        genre, content_format, tone, story_author, art_author, rating, views, priority
      )
    `)
    .eq('section_id', sectionId)
    .order('display_order', { ascending: true });

  if (featuredError) {
    console.error('[MicrodramaSpotlight] Featured fetch error:', featuredError);
    throw new Error('Failed to fetch featured titles');
  }

  // Normalize the join. Keep every curated title regardless of priority;
  // drop only rows whose underlying title is missing (e.g. deleted).
  const validFeatured = (featured || [])
    .map((f) => ({
      ...f,
      titles: Array.isArray(f.titles) ? f.titles[0] : f.titles,
    }))
    .filter((f) => f.titles != null);

  if (validFeatured.length === 0) return [];

  // Fetch format-fit analysis for these titles
  const titleIds = validFeatured.map((f) => f.title_id);
  const { data: fitData, error: fitError } = await supabase
    .from('title_format_fit')
    .select('title_id, microdrama_score, microdrama_analysis')
    .in('title_id', titleIds);

  if (fitError) {
    console.error('[MicrodramaSpotlight] Format fit fetch error:', fitError);
    throw new Error('Failed to fetch format fit data');
  }

  // Build a map of existing analyses, keyed by title_id.
  const analysisMap = new Map<string, import('@kstorybridge/tools').FormatAnalysis>(
    (fitData || [])
      .filter((r) => r.microdrama_analysis)
      .map((r) => [r.title_id, r.microdrama_analysis as import('@kstorybridge/tools').FormatAnalysis])
  );

  // Auto-generate microdrama analysis for curated titles that don't have it yet.
  // The edge function persists the result, so each title is generated at most once.
  const missingIds = titleIds.filter((id) => !analysisMap.has(id));
  if (missingIds.length > 0) {
    const results = await Promise.allSettled(
      missingIds.map((id) => analyzeFormatFit(id, userEmail, 'auto'))
    );
    results.forEach((result, i) => {
      const titleId = missingIds[i];
      if (result.status === 'fulfilled' && result.value?.microdrama_analysis) {
        analysisMap.set(titleId, result.value.microdrama_analysis);
      } else if (result.status === 'rejected') {
        console.error(`[MicrodramaSpotlight] Auto-generate failed for ${titleId}:`, result.reason);
      }
    });
  }

  // Assemble in admin display_order, skipping titles whose analysis is still unavailable.
  return validFeatured
    .map((f) => {
      const analysis = analysisMap.get(f.title_id);
      if (!analysis) return null;
      return {
        title: f.titles as SpotlightTitleData,
        analysis,
        note: (f as { note?: string | null }).note ?? null,
      } as SpotlightItem;
    })
    .filter((item): item is SpotlightItem => item !== null);
}

// =====================================================================
// EXPORT SERVICE OBJECT (for backward compatibility)
// =====================================================================

export const formatFitService = {
  // Analysis
  analyzeFormatFit,
  getFormatFit,
  getFormatFitScores,
  getFormatFitSummariesForFormat,
  getTitlesForFormat,
  saveFormatFitAnalysis,
  deleteFormatFit,
  // Utilities
  getFitLevel,
  getFitLevelColor,
  getFitLevelBgColor,
  getFitLevelLabel,
  formatDimensionName,
  getBestFormat,
  // Constants
  FORMAT_DISPLAY_NAMES,
  FORMAT_ICONS,
  FORMAT_DESCRIPTIONS,
  FIT_LEVEL_THRESHOLDS,
  FIT_LEVEL_COLORS,
};

export default formatFitService;
