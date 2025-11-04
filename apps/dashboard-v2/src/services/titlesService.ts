import { supabase } from '@/lib/supabase';
import { type PitchAnalysis } from '@/types/pitchAnalysis';

export interface Title {
  title_id: string;
  title_name_en?: string;
  title_name_kr?: string;
  synopsis?: string;
  tagline?: string;
  author?: string;
  genre?: string;
  content_format?: string;
  title_image?: string;
  title_url?: string;
  views?: number;
  rating?: number;
  rating_count?: number;
  chapters?: number;
  completed?: boolean;
  tags?: string[];
  perfect_for?: string;
  comps?: string[];
  tone?: string;
  audience?: string;
  pitch?: string;
  created_at?: string;
  updated_at?: string;
  // Pitch analysis data from title_content_analysis table
  pitch_analysis?: PitchAnalysis;
  processing_confidence?: number;
}

export interface TitleFilters {
  genre?: string;
  format?: string;
  search?: string;
  minRating?: number;
  completed?: boolean;
}

class TitlesService {
  /**
   * Fetch all titles with optional filters
   */
  async getTitles(filters?: TitleFilters): Promise<Title[]> {
    try {
      let query = supabase
        .from('titles')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.genre) {
        query = query.eq('genre', filters.genre);
      }

      if (filters?.format) {
        query = query.eq('content_format', filters.format);
      }

      if (filters?.search) {
        // Search in English name, Korean name, or synopsis
        query = query.or(
          `title_name_en.ilike.%${filters.search}%,title_name_kr.ilike.%${filters.search}%,synopsis.ilike.%${filters.search}%`
        );
      }

      if (filters?.minRating !== undefined) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching titles:', error);
        throw new Error(`Failed to fetch titles: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('❌ Titles service error:', error);
      throw error;
    }
  }

  /**
   * Fetch titles with pagination
   */
  async getTitlesPaginated(
    filters?: TitleFilters,
    offset: number = 0,
    limit: number = 12
  ): Promise<{ data: Title[]; hasMore: boolean }> {
    try {
      let query = supabase
        .from('titles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters (same as getTitles)
      if (filters?.genre) {
        query = query.eq('genre', filters.genre);
      }

      if (filters?.format) {
        query = query.eq('content_format', filters.format);
      }

      if (filters?.search) {
        // Search in English name, Korean name, or synopsis
        query = query.or(
          `title_name_en.ilike.%${filters.search}%,title_name_kr.ilike.%${filters.search}%,synopsis.ilike.%${filters.search}%`
        );
      }

      if (filters?.minRating !== undefined) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching paginated titles:', error);
        throw new Error(`Failed to fetch titles: ${error.message}`);
      }

      const hasMore = count ? offset + limit < count : false;

      return {
        data: data || [],
        hasMore,
      };
    } catch (error: any) {
      console.error('❌ Paginated titles service error:', error);
      throw error;
    }
  }

  /**
   * Fetch a single title by ID with pitch analysis data
   */
  async getTitleById(titleId: string): Promise<Title | null> {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select(`
          *,
          title_content_analysis (
            pitch_analysis,
            processing_confidence
          )
        `)
        .eq('title_id', titleId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching title:', error);
        throw new Error(`Failed to fetch title: ${error.message}`);
      }

      // Flatten the nested title_content_analysis data
      if (data && data.title_content_analysis) {
        const analysis = Array.isArray(data.title_content_analysis)
          ? data.title_content_analysis[0]
          : data.title_content_analysis;

        data.pitch_analysis = analysis?.pitch_analysis;
        data.processing_confidence = analysis?.processing_confidence;
        delete data.title_content_analysis;
      }

      return data;
    } catch (error: any) {
      console.error('❌ Title detail service error:', error);
      throw error;
    }
  }

  /**
   * Check if user has favorited a title
   */
  async isFavorited(titleId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('title_id', titleId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error checking favorite status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Favorite check error:', error);
      return false;
    }
  }

  /**
   * Add title to favorites
   */
  async addFavorite(titleId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('user_favorites').insert({
        title_id: titleId,
        user_id: userId,
      });

      if (error) {
        // Ignore duplicate key errors (already favorited)
        if (error.code === '23505') {
          return;
        }
        console.error('❌ Error adding favorite:', error);
        throw new Error(`Failed to add favorite: ${error.message}`);
      }
    } catch (error: any) {
      console.error('❌ Add favorite service error:', error);
      throw error;
    }
  }

  /**
   * Remove title from favorites
   */
  async removeFavorite(titleId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('title_id', titleId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error removing favorite:', error);
        throw new Error(`Failed to remove favorite: ${error.message}`);
      }
    } catch (error: any) {
      console.error('❌ Remove favorite service error:', error);
      throw error;
    }
  }

  /**
   * Get all favorited titles for a user
   */
  async getFavorites(userId: string): Promise<Title[]> {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('title:titles(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching favorites:', error);
        throw new Error(`Failed to fetch favorites: ${error.message}`);
      }

      // Extract titles from the nested structure
      return data?.map((fav: any) => fav.title).filter(Boolean) || [];
    } catch (error: any) {
      console.error('❌ Favorites service error:', error);
      throw error;
    }
  }

  /**
   * Get unique genres from all titles
   */
  async getGenres(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('genre')
        .not('genre', 'is', null);

      if (error) {
        console.error('❌ Error fetching genres:', error);
        return [];
      }

      // Extract and normalize genres
      const genresSet = new Set<string>();
      data?.forEach((t: any) => {
        if (t.genre) {
          // Convert to string to handle ENUM types, then split by comma for multi-genre entries
          const genreStr = String(t.genre);
          const genreList = genreStr.split(',').map((g: string) => g.trim().toLowerCase());
          genreList.forEach((genre: string) => {
            if (genre) genresSet.add(genre);
          });
        }
      });

      // Convert to array, capitalize first letter, and sort
      return Array.from(genresSet)
        .map(g => g.charAt(0).toUpperCase() + g.slice(1))
        .sort();
    } catch (error) {
      console.error('❌ Genres service error:', error);
      return [];
    }
  }

  /**
   * Get unique content formats from all titles
   */
  async getFormats(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('content_format')
        .not('content_format', 'is', null);

      if (error) {
        console.error('❌ Error fetching formats:', error);
        return [];
      }

      // Extract and normalize formats
      const formatsSet = new Set<string>();
      data?.forEach((t: any) => {
        if (t.content_format) {
          // Convert to string to handle ENUM types, then split by comma for multi-format entries
          const formatStr = String(t.content_format);
          const formatList = formatStr.split(',').map((f: string) => f.trim().toLowerCase());
          formatList.forEach((format: string) => {
            if (format) formatsSet.add(format);
          });
        }
      });

      // Convert to array, capitalize first letter, and sort
      return Array.from(formatsSet)
        .map(f => f.charAt(0).toUpperCase() + f.slice(1))
        .sort();
    } catch (error) {
      console.error('❌ Formats service error:', error);
      return [];
    }
  }

  /**
   * Update a title
   */
  async updateTitle(titleId: string, updates: Partial<Title>): Promise<void> {
    try {
      const { error } = await supabase
        .from('titles')
        .update(updates)
        .eq('title_id', titleId);

      if (error) {
        console.error('❌ Error updating title:', error);
        throw new Error(`Failed to update title: ${error.message}`);
      }
    } catch (error: any) {
      console.error('❌ Update title service error:', error);
      throw error;
    }
  }

  /**
   * Delete a title
   */
  async deleteTitle(titleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('titles')
        .delete()
        .eq('title_id', titleId);

      if (error) {
        console.error('❌ Error deleting title:', error);
        throw new Error(`Failed to delete title: ${error.message}`);
      }
    } catch (error: any) {
      console.error('❌ Delete title service error:', error);
      throw error;
    }
  }

  /**
   * Format number for display (e.g., 1.2M, 500K)
   */
  formatNumber(num?: number): string {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }
}

export const titlesService = new TitlesService();
