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
  title_name_en: string | null;
  title_name_kr: string | null;
  title_image: string | null;
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

  // Fetch title details for matching titles
  const titleIds = filtered.map((r) => r.title_id);
  const { data: titles, error: titlesError } = await supabase
    .from('titles')
    .select('title_id, slug, title_name_en, title_name_kr, title_image, genre, content_format, tone, story_author, art_author, rating, views')
    .in('title_id', titleIds);

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
