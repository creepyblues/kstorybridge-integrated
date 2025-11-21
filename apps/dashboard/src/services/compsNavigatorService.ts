/**
 * Comps Navigator Service
 *
 * Handles all API interactions for the Comps Navigator feature:
 * - Search for titles based on comp combinations
 * - Manage search history and bookmarks
 * - Cache and retrieve saved searches
 */

import { supabase } from '@/integrations/supabase/client';

export interface CompAlignment {
  comp_title: string;
  alignment_score: number;
  reasons: string[];
}

export interface TitleMatch {
  title_id: string;
  title_name_en: string;
  title_name_kr: string;
  match_score: number; // 0-100
  explanation: string;
  comp_alignments: CompAlignment[];
  title_image?: string;
  synopsis: string;
  genre: string[];
  tone: string;
}

export interface CompNavigatorResponse {
  results: TitleMatch[];
  search_id?: string;
  processing_time_ms: number;
  cost_estimate: number;
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

export const compsNavigatorService = {
  /**
   * Search for titles based on comp combination
   */
  async searchComps(
    compTitles: string[],
    refinementText?: string,
    userEmail?: string,
    saveSearch: boolean = true,
    searchName?: string
  ): Promise<CompNavigatorResponse> {
    if (!compTitles || compTitles.length === 0 || compTitles.length > 3) {
      throw new Error('Must provide 1-3 comparable titles');
    }

    if (!userEmail) {
      throw new Error('User email is required');
    }

    const requestBody = {
      comp_titles: compTitles,
      ...(refinementText && { refinement_text: refinementText }),
      user_email: userEmail,
      save_search: saveSearch,
      ...(searchName && { search_name: searchName })
    };

    console.log('[CompsNavigator] Sending request:', requestBody);

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
    const { data, error } = await supabase
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
