/**
 * Format Fit Service
 *
 * Service layer for the Format Fit Engine - analyzes titles for adaptation
 * suitability across 5 content formats: Film, TV Series, Animation, Microdrama, Audio Drama
 *
 * This is a shared service - apps must provide their own Supabase client.
 */

import type {
  SupabaseClientType,
  FormatType,
  FitLevel,
  FormatFitDimension,
  FormatFitScores,
  FormatFitResponse,
  FormatFitRecord,
  FormatFitSummary,
} from '../types';

// =====================================================================
// CONSTANTS
// =====================================================================

export const FORMAT_DISPLAY_NAMES: Record<FormatType, string> = {
  film: 'Film',
  tv_series: 'TV Series',
  animation: 'Animation',
  microdrama: 'Microdrama',
  audio_drama: 'Audio Drama',
};

export const FORMAT_ICONS: Record<FormatType, string> = {
  film: '🎬',
  tv_series: '📺',
  animation: '🎨',
  microdrama: '📱',
  audio_drama: '🎧',
};

export const FORMAT_DESCRIPTIONS: Record<FormatType, string> = {
  film: 'Theatrical or streaming movie (90-150 min)',
  tv_series: 'Multi-episode television drama (8-16 episodes)',
  animation: 'Animated series or film',
  microdrama: 'Short-form vertical drama (60-120s episodes)',
  audio_drama: 'Podcast or audio fiction series',
};

export const FIT_LEVEL_THRESHOLDS = {
  excellent: 80,
  good: 60,
  moderate: 40,
  poor: 0,
} as const;

export const FIT_LEVEL_COLORS: Record<FitLevel, string> = {
  excellent: 'bg-green-100 text-green-800 border-green-200',
  good: 'bg-blue-100 text-blue-800 border-blue-200',
  moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  poor: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const FIT_LEVEL_BG_COLORS: Record<FitLevel, string> = {
  excellent: 'bg-green-500',
  good: 'bg-blue-500',
  moderate: 'bg-amber-500',
  poor: 'bg-gray-400',
};

// =====================================================================
// UTILITY FUNCTIONS (no supabase needed)
// =====================================================================

/**
 * Get fit level from score
 */
export function getFitLevel(score: number): FitLevel {
  if (score >= FIT_LEVEL_THRESHOLDS.excellent) return 'excellent';
  if (score >= FIT_LEVEL_THRESHOLDS.good) return 'good';
  if (score >= FIT_LEVEL_THRESHOLDS.moderate) return 'moderate';
  return 'poor';
}

/**
 * Get CSS color class for score
 */
export function getFitLevelColor(score: number): string {
  return FIT_LEVEL_COLORS[getFitLevel(score)];
}

/**
 * Get background color for progress bar
 */
export function getFitLevelBgColor(score: number): string {
  return FIT_LEVEL_BG_COLORS[getFitLevel(score)];
}

/**
 * Get human-readable fit level label
 */
export function getFitLevelLabel(score: number): string {
  const level = getFitLevel(score);
  switch (level) {
    case 'excellent': return 'Excellent Fit';
    case 'good': return 'Good Fit';
    case 'moderate': return 'Moderate Fit';
    case 'poor': return 'Poor Fit';
  }
}

/**
 * Format dimension name for display
 */
export function formatDimensionName(dimension: FormatFitDimension): string {
  const names: Record<FormatFitDimension, string> = {
    narrative_structure: 'Narrative Structure',
    character_suitability: 'Character Suitability',
    visual_requirements: 'Visual Requirements',
    pacing_fit: 'Pacing Fit',
    production_feasibility: 'Production Feasibility',
    audience_alignment: 'Audience Alignment',
    genre_fit: 'Genre Fit',
  };
  return names[dimension] || dimension;
}

/**
 * Get best format from scores
 */
export function getBestFormat(scores: FormatFitScores): { format: FormatType; score: number } {
  const formats: FormatType[] = ['film', 'tv_series', 'animation', 'microdrama', 'audio_drama'];
  let bestFormat: FormatType = 'film';
  let bestScore = 0;

  for (const format of formats) {
    if (scores[format] > bestScore) {
      bestScore = scores[format];
      bestFormat = format;
    }
  }

  return { format: bestFormat, score: bestScore };
}

// =====================================================================
// API FUNCTIONS (with dependency injection)
// =====================================================================

/**
 * Generate format fit analysis for a title
 * Calls the format-fit-engine edge function
 */
export async function analyzeFormatFit(
  supabase: SupabaseClientType,
  titleId: string,
  userEmail: string,
  mode: 'rich' | 'limited' | 'auto' = 'auto'
): Promise<FormatFitResponse> {
  console.log('[FormatFit] Analyzing title:', titleId);

  const { data, error } = await supabase.functions.invoke('format-fit-engine', {
    body: {
      title_id: titleId,
      user_email: userEmail,
      mode,
    },
  });

  if (error) {
    console.error('[FormatFit] Analysis error:', error);
    throw new Error(error.message || 'Failed to analyze format fit');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  console.log('[FormatFit] Analysis complete:', {
    title: data.title_name,
    best_format: data.best_format,
    best_score: data.best_format_score,
  });

  return data as FormatFitResponse;
}

/**
 * Get existing format fit analysis for a title
 */
export async function getFormatFit(
  supabase: SupabaseClientType,
  titleId: string
): Promise<FormatFitRecord | null> {
  const { data, error } = await supabase
    .from('title_format_fit')
    .select('*')
    .eq('title_id', titleId)
    .maybeSingle();

  if (error) {
    console.error('[FormatFit] Fetch error:', error);
    throw new Error('Failed to fetch format fit data');
  }

  return data as FormatFitRecord | null;
}

/**
 * Get format fit scores for multiple titles (for list views)
 */
export async function getFormatFitScores(
  supabase: SupabaseClientType,
  titleIds: string[]
): Promise<Map<string, FormatFitScores>> {
  if (titleIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('title_format_fit')
    .select('title_id, film_score, tv_series_score, animation_score, microdrama_score, audio_drama_score')
    .in('title_id', titleIds);

  if (error) {
    console.error('[FormatFit] Batch fetch error:', error);
    return new Map();
  }

  const scoresMap = new Map<string, FormatFitScores>();
  for (const row of data || []) {
    scoresMap.set(row.title_id, {
      film: row.film_score || 0,
      tv_series: row.tv_series_score || 0,
      animation: row.animation_score || 0,
      microdrama: row.microdrama_score || 0,
      audio_drama: row.audio_drama_score || 0,
    });
  }

  return scoresMap;
}

/**
 * Get format fit summaries for multiple titles (for title cards when filter active)
 * Returns score + summary for the specified format
 */
export async function getFormatFitSummariesForFormat(
  supabase: SupabaseClientType,
  titleIds: string[],
  format: FormatType
): Promise<Map<string, FormatFitSummary>> {
  if (titleIds.length === 0) {
    return new Map();
  }

  // Fetch all score and analysis columns to avoid dynamic column typing issues
  const { data, error } = await supabase
    .from('title_format_fit')
    .select('title_id, film_score, tv_series_score, animation_score, microdrama_score, audio_drama_score, film_analysis, tv_series_analysis, animation_analysis, microdrama_analysis, audio_drama_analysis')
    .in('title_id', titleIds);

  if (error) {
    console.error('[FormatFit] Batch summary fetch error:', error);
    return new Map();
  }

  const summaryMap = new Map<string, FormatFitSummary>();
  for (const row of data || []) {
    // Get the score for the selected format
    const scoreKey = `${format}_score` as keyof typeof row;
    const analysisKey = `${format}_analysis` as keyof typeof row;

    const score = (row[scoreKey] as number) || 0;
    const analysis = row[analysisKey] as { summary?: string } | null;

    summaryMap.set(row.title_id, {
      title_id: row.title_id,
      score,
      fit_level: getFitLevelLabel(score),
      summary: analysis?.summary || '',
    });
  }

  return summaryMap;
}

/**
 * Search titles by format fit score
 */
export async function getTitlesForFormat(
  supabase: SupabaseClientType,
  format: FormatType,
  minScore: number = 60,
  limit: number = 30
): Promise<{ title_id: string; score: number }[]> {
  // Select all score columns to avoid dynamic column typing issues
  const { data, error } = await supabase
    .from('title_format_fit')
    .select('title_id, film_score, tv_series_score, animation_score, microdrama_score, audio_drama_score');

  if (error) {
    console.error('[FormatFit] Filter error:', error);
    throw new Error('Failed to filter by format');
  }

  // Filter and sort in JavaScript
  const scoreKey = `${format}_score` as keyof (typeof data)[0];
  return (data || [])
    .filter((row) => {
      const score = row[scoreKey] as number | null;
      return score !== null && score >= minScore;
    })
    .map((row) => ({
      title_id: row.title_id,
      score: row[scoreKey] as number,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Save format fit analysis to database
 * Called by edge function, but available for manual saves if needed
 */
export async function saveFormatFitAnalysis(
  supabase: SupabaseClientType,
  titleId: string,
  response: FormatFitResponse
): Promise<void> {
  const { error } = await supabase
    .from('title_format_fit')
    .upsert({
      title_id: titleId,
      film_score: response.scores.film,
      tv_series_score: response.scores.tv_series,
      animation_score: response.scores.animation,
      microdrama_score: response.scores.microdrama,
      audio_drama_score: response.scores.audio_drama,
      film_analysis: response.film_analysis,
      tv_series_analysis: response.tv_series_analysis,
      animation_analysis: response.animation_analysis,
      microdrama_analysis: response.microdrama_analysis,
      audio_drama_analysis: response.audio_drama_analysis,
      story_deconstruction: response.story_deconstruction,
      data_completeness: response.data_completeness,
      mode_used: response.mode_used,
      analysis_version: response.engine_version,
      processing_time_ms: response.processing_time_ms,
      cost_estimate: response.cost_estimate,
    }, {
      onConflict: 'title_id',
    });

  if (error) {
    console.error('[FormatFit] Save error:', error);
    throw new Error('Failed to save format fit analysis');
  }
}

/**
 * Delete format fit analysis for a title
 */
export async function deleteFormatFit(
  supabase: SupabaseClientType,
  titleId: string
): Promise<void> {
  const { error } = await supabase
    .from('title_format_fit')
    .delete()
    .eq('title_id', titleId);

  if (error) {
    console.error('[FormatFit] Delete error:', error);
    throw new Error('Failed to delete format fit analysis');
  }
}

// =====================================================================
// FACTORY FUNCTION (creates service bound to specific client)
// =====================================================================

/**
 * Create a format fit service instance bound to a Supabase client
 */
export function createFormatFitService(supabase: SupabaseClientType) {
  return {
    // Analysis
    analyzeFormatFit: (titleId: string, userEmail: string, mode?: 'rich' | 'limited' | 'auto') =>
      analyzeFormatFit(supabase, titleId, userEmail, mode),
    getFormatFit: (titleId: string) =>
      getFormatFit(supabase, titleId),
    getFormatFitScores: (titleIds: string[]) =>
      getFormatFitScores(supabase, titleIds),
    getFormatFitSummariesForFormat: (titleIds: string[], format: FormatType) =>
      getFormatFitSummariesForFormat(supabase, titleIds, format),
    getTitlesForFormat: (format: FormatType, minScore?: number, limit?: number) =>
      getTitlesForFormat(supabase, format, minScore, limit),
    saveFormatFitAnalysis: (titleId: string, response: FormatFitResponse) =>
      saveFormatFitAnalysis(supabase, titleId, response),
    deleteFormatFit: (titleId: string) =>
      deleteFormatFit(supabase, titleId),
    // Utilities (no supabase needed)
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
}
