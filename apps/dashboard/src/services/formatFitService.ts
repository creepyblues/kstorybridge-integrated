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
