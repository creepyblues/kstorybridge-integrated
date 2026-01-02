/**
 * Comps Generator Service
 *
 * AI-powered engine that analyzes Korean titles and suggests Hollywood/global comparable titles.
 * Uses GPT-4 for story deconstruction and comp matching across 8 dimensions.
 *
 * This is a shared service - apps must provide their own Supabase client.
 */

import type {
  SupabaseClientType,
  CompsGeneratorResponse,
  CompsGeneratorError,
  SuggestedComp,
} from '../types';

// =====================================================================
// SERVICE FUNCTIONS (with dependency injection)
// =====================================================================

/**
 * Generate comps for a title using AI analysis
 *
 * @param supabase - Supabase client instance
 * @param titleId - UUID of the title to analyze
 * @param userEmail - Email of the user requesting generation
 * @param mode - Optional mode override ('rich' | 'limited' | 'auto')
 * @returns CompsGeneratorResponse with suggested comps
 */
export async function generateComps(
  supabase: SupabaseClientType,
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
 * @param supabase - Supabase client instance
 * @param titleId - UUID of the title
 * @param comps - Array of comp titles to save (e.g., ["Squid Game", "Parasite"])
 */
export async function saveCompsToTitle(
  supabase: SupabaseClientType,
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
 * @param supabase - Supabase client instance
 * @param titleId - UUID of the title
 * @param selectedCompTitles - Array of comp titles selected by admin
 * @param allComps - Full suggested_comps array from generator response
 */
export async function saveCompsWithAnalysis(
  supabase: SupabaseClientType,
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
 * @param supabase - Supabase client instance
 * @param titleId - UUID of the title
 * @param newComps - Array of new comp titles to add
 */
export async function appendCompsToTitle(
  supabase: SupabaseClientType,
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
  await saveCompsToTitle(supabase, titleId, mergedComps);
}

/**
 * Get current comps for a title
 *
 * @param supabase - Supabase client instance
 * @param titleId - UUID of the title
 * @returns Array of comp titles or empty array
 */
export async function getCurrentComps(
  supabase: SupabaseClientType,
  titleId: string
): Promise<string[]> {
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
 * Get comps with full analysis for a title
 *
 * @param supabase - Supabase client instance
 * @param titleId - UUID of the title
 * @returns Object with comps array and analysis
 */
export async function getCompsWithAnalysis(
  supabase: SupabaseClientType,
  titleId: string
): Promise<{ comps: string[]; analysis: SuggestedComp[] }> {
  const { data, error } = await supabase
    .from('titles')
    .select('comps, comps_analysis')
    .eq('title_id', titleId)
    .single();

  if (error) {
    console.error('[CompsGenerator] Get comps with analysis error:', error);
    return { comps: [], analysis: [] };
  }

  return {
    comps: data?.comps || [],
    analysis: (data?.comps_analysis || []) as SuggestedComp[],
  };
}

/**
 * Clear all comps from a title
 *
 * @param supabase - Supabase client instance
 * @param titleId - UUID of the title
 */
export async function clearComps(
  supabase: SupabaseClientType,
  titleId: string
): Promise<void> {
  await saveCompsToTitle(supabase, titleId, []);
}

// =====================================================================
// UTILITY FUNCTIONS (no supabase needed)
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
// FACTORY FUNCTION (creates service bound to specific client)
// =====================================================================

/**
 * Create a comps generator service instance bound to a Supabase client
 */
export function createCompsGeneratorService(supabase: SupabaseClientType) {
  return {
    generateComps: (titleId: string, userEmail: string, mode?: 'rich' | 'limited' | 'auto') =>
      generateComps(supabase, titleId, userEmail, mode),
    saveCompsToTitle: (titleId: string, comps: string[]) =>
      saveCompsToTitle(supabase, titleId, comps),
    saveCompsWithAnalysis: (titleId: string, selectedCompTitles: string[], allComps: SuggestedComp[]) =>
      saveCompsWithAnalysis(supabase, titleId, selectedCompTitles, allComps),
    appendCompsToTitle: (titleId: string, newComps: string[]) =>
      appendCompsToTitle(supabase, titleId, newComps),
    getCurrentComps: (titleId: string) =>
      getCurrentComps(supabase, titleId),
    getCompsWithAnalysis: (titleId: string) =>
      getCompsWithAnalysis(supabase, titleId),
    clearComps: (titleId: string) =>
      clearComps(supabase, titleId),
    // Utilities (no supabase needed)
    getMatchScoreColor,
    getMatchScoreLabel,
    formatDimensionName,
    getDimensionWeight,
  };
}
