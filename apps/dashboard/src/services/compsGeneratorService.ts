/**
 * Comps Generator Service
 *
 * AI-powered engine that analyzes Korean titles and suggests Hollywood/global comparable titles.
 * Uses GPT-4 for story deconstruction and comp matching across 8 dimensions.
 *
 * @see /docs/features/COMPS_GENERATOR.md for full documentation
 */

import { supabase } from '@/lib/supabase';

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================

export interface DimensionScore {
  dimension: string;
  score: number;
  reason: string;
}

export interface SuggestedComp {
  comp_title: string;
  comp_year?: number;
  comp_type: string;  // "TV Series" | "Film" | "Anime"
  overall_match_score: number;  // 0-100
  dimension_scores: DimensionScore[];
  explanation: string;
  match_reasons: string[];
  // IMDB enrichment (from OMDB API)
  imdb_id?: string;   // e.g., "tt6994104"
  imdb_url?: string;  // e.g., "https://www.imdb.com/title/tt6994104"
  poster_url?: string; // e.g., "https://m.media-amazon.com/images/M/..."
}

export interface CompsGeneratorResponse {
  title_id: string;
  title_name: string;
  mode_used: 'rich' | 'limited';
  data_completeness: number;  // 0-100
  suggested_comps: SuggestedComp[];
  analysis_summary: string;
  processing_time_ms: number;
  cost_estimate: number;
}

export interface CompsGeneratorError {
  error: string;
}

// =====================================================================
// SERVICE FUNCTIONS
// =====================================================================

/**
 * Generate comps for a title using AI analysis
 *
 * @param titleId - UUID of the title to analyze
 * @param userEmail - Email of the user requesting generation
 * @param mode - Optional mode override ('rich' | 'limited' | 'auto')
 * @returns CompsGeneratorResponse with suggested comps
 */
export async function generateComps(
  titleId: string,
  userEmail: string,
  mode: 'rich' | 'limited' | 'auto' = 'auto'
): Promise<CompsGeneratorResponse> {
  const { data, error } = await supabase.functions.invoke<CompsGeneratorResponse | CompsGeneratorError>(
    'comps-generator',
    {
      body: {
        title_id: titleId,
        mode,
        user_email: userEmail,
      },
    }
  );

  if (error) {
    console.error('[CompsGenerator] Edge function error:', error);
    throw new Error(error.message || 'Failed to generate comps');
  }

  if (!data) {
    throw new Error('No response from comps generator');
  }

  // Check if response is an error
  if ('error' in data) {
    throw new Error(data.error);
  }

  return data as CompsGeneratorResponse;
}

/**
 * Save selected comps to a title's comps array
 *
 * @param titleId - UUID of the title
 * @param comps - Array of comp titles to save (e.g., ["Squid Game", "Parasite"])
 */
export async function saveCompsToTitle(
  titleId: string,
  comps: string[]
): Promise<void> {
  const { error } = await supabase
    .from('titles')
    .update({ comps })
    .eq('title_id', titleId);

  if (error) {
    console.error('[CompsGenerator] Save comps error:', error);
    throw new Error(error.message || 'Failed to save comps');
  }
}

/**
 * Save selected comps AND their full analysis to a title
 * MERGES new comps with existing ones (does not overwrite)
 *
 * @param titleId - UUID of the title
 * @param selectedCompTitles - Array of comp titles selected by admin
 * @param allComps - Full suggested_comps array from generator response
 */
export async function saveCompsWithAnalysis(
  titleId: string,
  selectedCompTitles: string[],
  allComps: SuggestedComp[]
): Promise<void> {
  // 1. Fetch existing comps data
  const { data: existingTitle, error: fetchError } = await supabase
    .from('titles')
    .select('comps, comps_analysis')
    .eq('title_id', titleId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[CompsGenerator] Fetch existing comps error:', fetchError);
    throw new Error(fetchError.message || 'Failed to fetch existing comps');
  }

  const existingComps: string[] = existingTitle?.comps || [];
  const existingAnalysis: SuggestedComp[] = (existingTitle?.comps_analysis || []) as SuggestedComp[];

  // 2. Filter new comps to only include selected ones
  const newAnalysis = allComps.filter(comp =>
    selectedCompTitles.includes(comp.comp_title)
  );

  // 3. Merge: add new comps that don't already exist (by comp_title)
  const existingTitles = new Set(existingAnalysis.map(c => c.comp_title));

  const mergedAnalysis = [
    ...existingAnalysis,
    ...newAnalysis.filter(c => !existingTitles.has(c.comp_title))
  ];

  const mergedComps = [...new Set([
    ...existingComps,
    ...selectedCompTitles
  ])];

  // 4. Save merged result
  const { error } = await supabase
    .from('titles')
    .update({
      comps: mergedComps,
      comps_analysis: mergedAnalysis,
    })
    .eq('title_id', titleId);

  if (error) {
    console.error('[CompsGenerator] Save comps with analysis error:', error);
    throw new Error(error.message || 'Failed to save comps with analysis');
  }
}

/**
 * Append comps to existing comps array (deduplicates)
 *
 * @param titleId - UUID of the title
 * @param newComps - Array of new comp titles to add
 */
export async function appendCompsToTitle(
  titleId: string,
  newComps: string[]
): Promise<void> {
  // Fetch existing comps
  const { data: title, error: fetchError } = await supabase
    .from('titles')
    .select('comps')
    .eq('title_id', titleId)
    .single();

  if (fetchError) {
    console.error('[CompsGenerator] Fetch comps error:', fetchError);
    throw new Error(fetchError.message || 'Failed to fetch existing comps');
  }

  // Merge and deduplicate
  const existingComps = title?.comps || [];
  const mergedComps = [...new Set([...existingComps, ...newComps])];

  // Save merged comps
  await saveCompsToTitle(titleId, mergedComps);
}

/**
 * Get current comps for a title
 *
 * @param titleId - UUID of the title
 * @returns Array of comp titles or empty array
 */
export async function getCurrentComps(titleId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('titles')
    .select('comps')
    .eq('title_id', titleId)
    .single();

  if (error) {
    console.error('[CompsGenerator] Get comps error:', error);
    return [];
  }

  return data?.comps || [];
}

/**
 * Clear all comps from a title
 *
 * @param titleId - UUID of the title
 */
export async function clearComps(titleId: string): Promise<void> {
  await saveCompsToTitle(titleId, []);
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Get match score color based on score value
 */
export function getMatchScoreColor(score: number): string {
  if (score >= 85) return 'green';
  if (score >= 70) return 'blue';
  if (score >= 55) return 'yellow';
  return 'gray';
}

/**
 * Get match score label based on score value
 */
export function getMatchScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Strong Match';
  if (score >= 55) return 'Moderate Match';
  return 'Weak Match';
}

/**
 * Format dimension name for display
 */
export function formatDimensionName(dimension: string): string {
  const names: Record<string, string> = {
    genre_blueprint: 'Genre Blueprint',
    tone_mood: 'Tone & Mood',
    character_archetypes: 'Characters',
    plot_structure: 'Plot Structure',
    setting_world: 'Setting & World',
    themes: 'Themes',
    target_audience: 'Target Audience',
    format_style: 'Format Style',
  };
  return names[dimension] || dimension;
}

/**
 * Get dimension weight for weighted average calculation
 */
export function getDimensionWeight(dimension: string): number {
  const weights: Record<string, number> = {
    genre_blueprint: 0.20,
    tone_mood: 0.15,
    character_archetypes: 0.15,
    plot_structure: 0.15,
    setting_world: 0.10,
    themes: 0.10,
    target_audience: 0.10,
    format_style: 0.05,
  };
  return weights[dimension] || 0.1;
}

// =====================================================================
// EXPORT SERVICE OBJECT
// =====================================================================

export const compsGeneratorService = {
  generateComps,
  saveCompsToTitle,
  saveCompsWithAnalysis,
  appendCompsToTitle,
  getCurrentComps,
  clearComps,
  getMatchScoreColor,
  getMatchScoreLabel,
  formatDimensionName,
  getDimensionWeight,
};

export default compsGeneratorService;
