// Service: Mandate Matcher
// Created: 2025-11-21
// Description: Service layer for mandate-based title recommendations

import { supabase } from '@/lib/supabase';

export interface TitleMatch {
  title_id: string;
  title_name_en: string;
  title_name_kr: string;
  match_score: number;
  title_image?: string;
  synopsis: string;
  genre: string[];
  tone: string;
  content_format?: string;
  story_author?: string;
  art_author?: string;
}

export interface MandateSearch {
  id: string;
  user_email: string;
  mandate_text: string;
  search_results: TitleMatch[];
  created_at: string;
  result_count: number;
  avg_match_score: number;
}

export interface MandateMatchRequest {
  mandate_text: string;
  user_email: string;
  limit?: number;
}

export interface MandateMatchResponse {
  results: TitleMatch[];
  search_id: string;
  processing_time_ms: number;
  cost_estimate: number;
}

class MandateService {
  /**
   * Submit a new mandate and get matching titles
   */
  async searchMandates(
    mandateText: string,
    userEmail: string,
    limit: number = 15
  ): Promise<MandateMatchResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('mandate-matcher', {
        body: {
          mandate_text: mandateText,
          user_email: userEmail,
          limit,
        },
      });

      if (error) {
        console.error('Error calling mandate-matcher:', error);
        throw new Error(error.message || 'Failed to search mandates');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as MandateMatchResponse;
    } catch (error) {
      console.error('Error in searchMandates:', error);
      throw error;
    }
  }

  /**
   * Get user's recent mandate searches
   */
  async getRecentMandates(userEmail: string, limit: number = 20): Promise<MandateSearch[]> {
    try {
      const { data, error } = await supabase
        .from('mandate_searches')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent mandates:', error);
        throw error;
      }

      return data as MandateSearch[];
    } catch (error) {
      console.error('Error in getRecentMandates:', error);
      throw error;
    }
  }

  /**
   * Get a specific mandate search by ID
   */
  async getMandateById(mandateId: string): Promise<MandateSearch | null> {
    try {
      const { data, error } = await supabase
        .from('mandate_searches')
        .select('*')
        .eq('id', mandateId)
        .single();

      if (error) {
        console.error('Error fetching mandate:', error);
        throw error;
      }

      return data as MandateSearch;
    } catch (error) {
      console.error('Error in getMandateById:', error);
      throw error;
    }
  }

  /**
   * Delete a mandate search
   */
  async deleteMandate(mandateId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('mandate_searches')
        .delete()
        .eq('id', mandateId);

      if (error) {
        console.error('Error deleting mandate:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteMandate:', error);
      throw error;
    }
  }

  /**
   * Get count of user's mandate searches
   */
  async getMandateCount(userEmail: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('mandate_searches')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', userEmail);

      if (error) {
        console.error('Error counting mandates:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getMandateCount:', error);
      return 0;
    }
  }
}

export const mandateService = new MandateService();
