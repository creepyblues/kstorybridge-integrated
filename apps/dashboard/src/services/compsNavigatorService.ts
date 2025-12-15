/**
 * Comps Navigator Service
 * Version: 2.0.0
 *
 * Handles all API interactions for the Comps Navigator feature:
 * - Search for titles based on comp combinations
 * - Manage search history and bookmarks
 * - Cache and retrieve saved searches
 *
 * V2.0.0: Added 8-dimensional scoring with aligned_comps
 */

import { supabase } from '@/lib/supabase';

// =====================================================================
// ENGINE CONSTANTS
// =====================================================================

export const COMPS_ENGINE_VERSION = '2.0.0';

export type DimensionKey =
  | 'genre_blueprint'
  | 'tone_mood'
  | 'character_archetypes'
  | 'plot_structure'
  | 'setting_world'
  | 'themes'
  | 'target_audience'
  | 'format_style';

export const DIMENSION_WEIGHTS: Record<DimensionKey, number> = {
  genre_blueprint: 0.20,
  tone_mood: 0.15,
  character_archetypes: 0.15,
  plot_structure: 0.15,
  setting_world: 0.10,
  themes: 0.10,
  target_audience: 0.10,
  format_style: 0.05,
};

export const DIMENSION_DISPLAY_NAMES: Record<DimensionKey, string> = {
  genre_blueprint: 'Genre Blueprint',
  tone_mood: 'Tone & Mood',
  character_archetypes: 'Characters',
  plot_structure: 'Plot Structure',
  setting_world: 'Setting & World',
  themes: 'Themes',
  target_audience: 'Target Audience',
  format_style: 'Format Style',
};

// =====================================================================
// TYPES
// =====================================================================

/**
 * Comparable title with optional IMDB metadata
 * Used in CompsNavigatorInput for OMDB autocomplete
 */
export interface CompTitle {
  title: string;
  imdbID: string;
  year: string;
  type: 'movie' | 'series' | 'episode';
  poster?: string;
}

/**
 * Score for a single dimension (V2.0.0)
 */
export interface DimensionScore {
  dimension: DimensionKey;
  score: number;              // 0-100
  reason: string;             // 1-2 sentence explanation
  aligned_comps: string[];    // Which input comps this dimension aligned with
}

/**
 * Title match result (V2.0.0)
 */
export interface TitleMatch {
  title_id: string;
  title_name_en: string;
  title_name_kr: string;
  // V2.0.0 fields
  overall_match_score?: number;     // NEW - preferred
  dimension_scores?: DimensionScore[];  // NEW - 8 dimensions
  match_reasons?: string[];         // NEW - 4-5 bullet points
  // Legacy field (backward compat)
  match_score?: number;             // DEPRECATED - use overall_match_score
  explanation: string;
  // Metadata
  title_image?: string;
  synopsis: string;
  genre: string[];
  tone: string;
  content_format?: string;
  has_pitch_deck?: boolean;
}

export interface CompNavigatorResponse {
  results: TitleMatch[];
  search_id?: string;
  processing_time_ms: number;
  cost_estimate: number;
  // V2.0.0 fields
  engine_version?: string;
  mode_used?: 'fast' | 'deep';
  // V2.1.0 - Relevancy filtering fields
  filtered_count?: number;          // How many results were filtered out
  no_results_message?: string;      // Message when no relevant results found
  suggestions?: string[];           // Suggestions when no results
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Get the effective match score (supports both v1 and v2 responses)
 */
export function getMatchScore(match: TitleMatch): number {
  return match.overall_match_score ?? match.match_score ?? 0;
}

/**
 * Get score level for UI display
 */
export function getScoreLevel(score: number): 'excellent' | 'strong' | 'moderate' | 'weak' {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 55) return 'moderate';
  return 'weak';
}

/**
 * Get color class for score level
 */
export function getScoreColorClass(score: number): string {
  const level = getScoreLevel(score);
  switch (level) {
    case 'excellent':
      return 'bg-green-500';
    case 'strong':
      return 'bg-blue-500';
    case 'moderate':
      return 'bg-yellow-500';
    case 'weak':
      return 'bg-gray-400';
  }
}

/**
 * Format dimension name for display
 */
export function formatDimensionName(key: string): string {
  return DIMENSION_DISPLAY_NAMES[key as DimensionKey] || key;
}

/**
 * Get dimension weight as percentage string
 */
export function getDimensionWeightPercent(key: string): string {
  const weight = DIMENSION_WEIGHTS[key as DimensionKey];
  if (weight === undefined) return '0%';
  return `${Math.round(weight * 100)}%`;
}

export interface CompSearch {
  id: string;
  user_email: string;
  comp_titles: string[];
  refinement_text?: string;
  search_name?: string;
  search_results?: TitleMatch[];
  created_at: string;
  is_bookmarked: boolean;
  result_count: number;
  avg_match_score: number;
}

export interface CompDescriptionsResponse {
  descriptions: Record<string, string>;
  processing_time_ms: number;
}

export const compsNavigatorService = {
  /**
   * Generate LLM descriptions for comp titles (Phase 1 of two-phase search)
   * This is a fast call (~2-3s) that returns thematic descriptions
   * to show users what the AI understood about their comps.
   */
  async getCompDescriptions(compTitles: string[]): Promise<CompDescriptionsResponse> {
    if (!compTitles || compTitles.length === 0 || compTitles.length > 3) {
      throw new Error('Must provide 1-3 comparable titles');
    }

    console.log('[CompsNavigator] Getting descriptions for:', compTitles);

    const { data, error } = await supabase.functions.invoke('comp-navigator', {
      body: {
        action: 'describe',
        comp_titles: compTitles,
        user_email: 'describe@kstorybridge.com' // Not required for describe action
      }
    });

    if (error) {
      console.error('[CompsNavigator] Description error:', error);
      throw new Error(data?.error || error.message || 'Failed to get descriptions');
    }

    return data as CompDescriptionsResponse;
  },

  /**
   * Search for titles based on comp combination
   * Optionally accepts pre-generated descriptions to skip LLM call
   */
  async searchComps(
    compTitles: string[],
    refinementText?: string,
    userEmail?: string,
    saveSearch: boolean = true,
    searchName?: string,
    providedDescriptions?: Record<string, string>
  ): Promise<CompNavigatorResponse> {
    if (!compTitles || compTitles.length === 0 || compTitles.length > 3) {
      throw new Error('Must provide 1-3 comparable titles');
    }

    // Email is only required when saving search
    if (saveSearch && !userEmail) {
      throw new Error('User email is required when saving search');
    }

    const requestBody = {
      action: 'search' as const,
      comp_titles: compTitles,
      ...(refinementText && { refinement_text: refinementText }),
      // For trial mode, use placeholder email when not saving
      user_email: userEmail || 'trial@kstorybridge.com',
      save_search: saveSearch,
      ...(searchName && { search_name: searchName }),
      ...(providedDescriptions && { provided_descriptions: providedDescriptions })
    };

    console.log('[CompsNavigator] Sending search request:', {
      ...requestBody,
      has_provided_descriptions: !!providedDescriptions
    });

    const { data, error } = await supabase.functions.invoke('comp-navigator', {
      body: requestBody
    });

    if (error) {
      console.error('[CompsNavigator] Search error:', error);
      // Try to extract the actual error message from the response
      const errorMessage = data?.error || error.message || 'Failed to search comps';
      console.error('[CompsNavigator] Error details:', { data, error, errorMessage });
      throw new Error(errorMessage);
    }

    return data as CompNavigatorResponse;
  },

  /**
   * Get recent searches for a user
   */
  async getRecentSearches(userEmail: string, limit: number = 10): Promise<CompSearch[]> {
    const { data, error } = await supabase
      .from('comp_searches')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[CompsNavigator] Failed to get recent searches:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get bookmarked searches for a user
   */
  async getBookmarkedSearches(userEmail: string): Promise<CompSearch[]> {
    const { data, error } = await supabase
      .from('comp_searches')
      .select('*')
      .eq('user_email', userEmail)
      .eq('is_bookmarked', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CompsNavigator] Failed to get bookmarked searches:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Bookmark a search
   */
  async bookmarkSearch(searchId: string, searchName: string): Promise<void> {
    const { error } = await supabase
      .from('comp_searches')
      .update({
        is_bookmarked: true,
        search_name: searchName
      })
      .eq('id', searchId);

    if (error) {
      console.error('[CompsNavigator] Failed to bookmark search:', error);
      throw error;
    }
  },

  /**
   * Remove bookmark from a search
   */
  async unbookmarkSearch(searchId: string): Promise<void> {
    const { error } = await supabase
      .from('comp_searches')
      .update({
        is_bookmarked: false,
        search_name: null
      })
      .eq('id', searchId);

    if (error) {
      console.error('[CompsNavigator] Failed to unbookmark search:', error);
      throw error;
    }
  },

  /**
   * Delete a search
   */
  async deleteSearch(searchId: string): Promise<void> {
    const { error } = await supabase
      .from('comp_searches')
      .delete()
      .eq('id', searchId);

    if (error) {
      console.error('[CompsNavigator] Failed to delete search:', error);
      throw error;
    }
  },

  /**
   * Get a specific search by ID
   */
  async getSearchById(searchId: string): Promise<CompSearch | null> {
    const { data, error} = await supabase
      .from('comp_searches')
      .select('*')
      .eq('id', searchId)
      .single();

    if (error) {
      console.error('[CompsNavigator] Failed to get search:', error);
      return null;
    }

    return data;
  }
};
