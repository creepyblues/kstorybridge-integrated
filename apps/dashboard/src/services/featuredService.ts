import { supabase, withRetry, isNetworkError } from "@/integrations/supabase/client";
import type { Title } from "./titlesService";

export type Featured = {
  id: string;
  title_id: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type FeaturedWithTitle = Featured & {
  titles: Title;
};

export const featuredService = {
  // Get most recently added featured title
  async getMostRecentFeatured(): Promise<FeaturedWithTitle | null> {
    const { data, error } = await withRetry(
      () => supabase
        .from('featured')
        .select(`
          *,
          titles (*)
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      {
        maxRetries: 2,
        operationName: 'getMostRecentFeatured',
        retryCondition: isNetworkError
      }
    );

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw new Error(`Failed to fetch most recent featured title: ${error.message}`);
    }

    return data;
  },

  // Get featured titles sorted by views (for top rated)
  async getFeaturedByViews(limit: number = 5): Promise<FeaturedWithTitle[]> {
    const { data, error } = await withRetry(
      () => supabase
        .from('featured')
        .select(`
          *,
          titles (*)
        `)
        .order('titles(views)', { ascending: false })
        .limit(limit),
      {
        maxRetries: 2,
        operationName: 'getFeaturedByViews',
        retryCondition: isNetworkError
      }
    );

    if (error) {
      throw new Error(`Failed to fetch featured titles by views: ${error.message}`);
    }

    return data || [];
  },

  // Get all featured titles
  async getAllFeatured(): Promise<FeaturedWithTitle[]> {
    const { data, error } = await withRetry(
      () => supabase
        .from('featured')
        .select(`
          *,
          titles (*)
        `)
        .order('created_at', { ascending: false }),
      {
        maxRetries: 2,
        operationName: 'getAllFeatured',
        retryCondition: isNetworkError
      }
    );

    if (error) {
      throw new Error(`Failed to fetch all featured titles: ${error.message}`);
    }

    return data || [];
  },

  // Get featured titles (for homepage-style display)
  async getFeaturedTitles(): Promise<FeaturedWithTitle[]> {
    try {
      console.log('🎬 Loading featured titles with enhanced retry logic...');
      
      const { data, error } = await withRetry(
        () => supabase
          .from('featured')
          .select(`
            *,
            titles (
              title_id,
              title_name_en,
              title_name_kr,
              title_image,
              tagline,
              genre,
              content_format,
              story_author,
              pitch,
              tone,
              comps,
              synopsis
            )
          `)
          .order('created_at', { ascending: false }),
        {
          maxRetries: 2,
          baseDelay: 1000,
          operationName: 'getFeaturedTitles',
          retryCondition: isNetworkError
        }
      );

      if (error) {
        console.warn('⚠️ Failed to fetch featured titles after retries:', error.message);
        return []; // Return empty array instead of throwing
      }

      console.log(`✅ Successfully loaded ${data?.length || 0} featured titles`);
      return data || [];
    } catch (error) {
      console.error('❌ Featured titles service error:', error);
      return []; // Return empty array on any error
    }
  }
};