import { supabase } from '@/lib/supabase';
import { type PitchAnalysis } from '@/types/pitchAnalysis';
import { vectorSearchService, type VectorSearchResult } from './vectorSearchService';

// Character detail structure from creator questionnaire
export interface CharacterDetail {
  name: string;
  name_kr?: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  age?: number | string;
  gender?: string;
  ethnicity?: string;
  occupation?: string;
  background?: string;
  personality?: string;
  arc?: string;
  relationships?: string;
}

// Creator achievements structure
export interface CreatorAchievements {
  total_titles?: number;
  total_views?: string;
  notable_works?: string[];
  awards_received?: string[];
  industry_recognition?: string;
}

// Platform data structure (from title_platforms table)
export interface TitlePlatform {
  id: string;
  platform_name: string;
  platform_url: string;
  views?: number;
  subscribers?: number;
  other_metrics?: Record<string, unknown>;
}

// Document structure (from title_documents table)
export interface TitleDocument {
  id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  shareable_with_nda?: boolean;
  external_url?: string;
}

export interface Title {
  title_id: string;

  // Basic Info
  title_name_en?: string;
  title_name_kr?: string;
  title_url?: string;
  title_url_en?: string;
  title_image?: string;

  // Authors & Credits
  author?: string;
  story_author?: string;
  art_author?: string;
  story_author_kr?: string;
  art_author_kr?: string;
  original_author?: string;
  original_author_kr?: string;
  writer?: string;
  illustrator?: string;

  // Title variants
  is_official_english_title?: boolean;
  english_title_type?: 'official' | 'translation';
  script_title_kr?: string;
  script_title_en?: string;
  art_title_kr?: string;
  art_title_en?: string;
  underlying_novel_kr?: string;
  underlying_novel_en?: string;

  // Classification
  genre?: string[];
  genre_kr?: string[];
  content_format?: string;
  tone?: string;
  audience?: string;
  age_rating?: string;
  tags?: string[];
  keywords?: string[];

  // Synopsis & Description
  synopsis?: string;
  tagline?: string;
  tagline_kr?: string;
  description_kr?: string;
  note?: string;
  note_kr?: string;

  // Business & Rights
  rights?: string;
  rights_available?: string[];
  rights_holder_name?: string;
  rights_holder_company?: string;
  cp?: string;
  pitch?: string;
  perfect_for?: string;
  comps?: string[];

  // Metrics
  views?: number;
  likes?: number;
  rating?: number;
  rating_count?: number;
  chapters?: number;
  completed?: boolean;

  // Story Details (from questionnaire)
  inspiration?: string;
  important_issues?: string;
  setting_description?: string;
  world_lore?: string;
  supernatural_concepts?: string;
  character_details?: CharacterDetail[];

  // Narrative Structure
  story_structure?: string;
  planned_ending?: string;
  narrative_arc?: string;

  // Achievements & Recognition
  awards?: string[];
  sales_records?: string;
  merchandise_deals?: string;
  print_editions?: boolean;
  print_edition_details?: string;
  media_coverage?: string;
  celebrity_endorsements?: string;
  creator_achievements?: CreatorAchievements;

  // System fields
  verified?: boolean;
  priority?: string;
  created_at?: string;
  updated_at?: string;
  creator_id?: string;

  // Related data (from joins)
  platforms?: TitlePlatform[];
  documents?: TitleDocument[];

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
        // Use contains operator for array field
        query = query.contains('genre', [filters.genre]);
      }

      if (filters?.format) {
        query = query.eq('content_format', filters.format);
      }

      if (filters?.search) {
        // Search in English name, Korean name, synopsis, and genre array
        // For genre search, we need to cast array to text for ILIKE matching
        query = query.or(
          `title_name_en.ilike.%${filters.search}%,title_name_kr.ilike.%${filters.search}%,synopsis.ilike.%${filters.search}%,genre.cs.{${filters.search}}`
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
        // Use contains operator for array field
        query = query.contains('genre', [filters.genre]);
      }

      if (filters?.format) {
        query = query.eq('content_format', filters.format);
      }

      if (filters?.search) {
        // Search in English name, Korean name, synopsis, and genre array
        // For genre search, we need to cast array to text for ILIKE matching
        query = query.or(
          `title_name_en.ilike.%${filters.search}%,title_name_kr.ilike.%${filters.search}%,synopsis.ilike.%${filters.search}%,genre.cs.{${filters.search}}`
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
   * Fetch a single title by ID with pitch analysis, platforms, and documents
   * Uses multiple queries for better reliability
   */
  async getTitleById(titleId: string): Promise<Title | null> {
    try {
      // Query 1: Get title data with content analysis
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

      if (!data) {
        console.log('ℹ️ Title not found:', titleId);
        return null;
      }

      // Query 2: Get pitch analysis separately (optional data)
      try {
        const { data: analysisData, error: analysisError } = await supabase
          .from('title_content_analysis')
          .select('pitch_analysis, processing_confidence')
          .eq('title_id', titleId)
          .maybeSingle();

        if (analysisError) {
          console.log('ℹ️ No pitch analysis found (this is normal for many titles)');
        } else if (analysisData?.pitch_analysis) {
          data.pitch_analysis = analysisData.pitch_analysis;
          data.processing_confidence = analysisData.processing_confidence;
          console.log('✅ Pitch analysis data attached to title');
          console.log('📊 Processing confidence:', analysisData.processing_confidence);
        } else {
          console.log('ℹ️ No pitch analysis data available for this title');
        }
      } catch (analysisError: unknown) {
        // Pitch analysis is optional - don't fail the entire request
        const message = analysisError instanceof Error ? analysisError.message : 'Unknown error';
        console.log('ℹ️ Pitch analysis query failed (optional data):', message);
      }

      // Query 3: Get platforms data (optional)
      try {
        const { data: platformsData, error: platformsError } = await supabase
          .from('title_platforms')
          .select('id, platform_name, platform_url, views, subscribers, other_metrics')
          .eq('title_id', titleId)
          .order('views', { ascending: false, nullsFirst: false });

        if (platformsError) {
          console.log('ℹ️ No platforms data found');
        } else if (platformsData && platformsData.length > 0) {
          data.platforms = platformsData;
          console.log('✅ Platforms data attached:', platformsData.length, 'platforms');
        }
      } catch (platformsError: unknown) {
        const message = platformsError instanceof Error ? platformsError.message : 'Unknown error';
        console.log('ℹ️ Platforms query failed (optional data):', message);
      }

      // Query 4: Get documents data (optional)
      try {
        const { data: documentsData, error: documentsError } = await supabase
          .from('title_documents')
          .select('id, document_type, file_url, file_name, file_size, shareable_with_nda, external_url')
          .eq('title_id', titleId)
          .order('created_at', { ascending: false });

        if (documentsError) {
          console.log('ℹ️ No documents data found');
        } else if (documentsData && documentsData.length > 0) {
          data.documents = documentsData;
          console.log('✅ Documents data attached:', documentsData.length, 'documents');
        }
      } catch (documentsError: unknown) {
        const message = documentsError instanceof Error ? documentsError.message : 'Unknown error';
        console.log('ℹ️ Documents query failed (optional data):', message);
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
    } catch (error: unknown) {
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
   * Semantic vector search for titles
   * Uses OpenAI embeddings for natural language queries
   *
   * @param query - Natural language search query (e.g., "romantic comedy set in Seoul")
   * @param limit - Maximum number of results (default: 30)
   * @returns Array of matching titles sorted by semantic relevance
   */
  async searchTitlesVector(query: string, limit: number = 30): Promise<Title[]> {
    try {
      console.log(`🔍 Vector search: "${query}"`);

      // Perform vector search
      const vectorResults = await vectorSearchService.vectorSearch(query, {
        limit,
        threshold: 0.4 // Minimum similarity score
      });

      if (vectorResults.length === 0) {
        console.log('ℹ️ No vector search results found');
        return [];
      }

      // Extract title IDs from vector search results
      const titleIds = vectorResults.map((result: VectorSearchResult) => result.title_id);

      // Fetch full title data from database
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .in('title_id', titleIds);

      if (error) {
        console.error('❌ Error fetching title details:', error);
        throw new Error(`Failed to fetch title details: ${error.message}`);
      }

      // Sort results by vector similarity order (preserve relevance ranking)
      const sortedTitles = titleIds
        .map(id => data?.find(title => title.title_id === id))
        .filter(Boolean) as Title[];

      console.log(`✅ Vector search returned ${sortedTitles.length} titles`);

      return sortedTitles;
    } catch (error: any) {
      console.error('❌ Vector search service error:', error);

      // Provide user-friendly error messages
      if (error.message.includes('OpenAI') || error.message.includes('quota') || error.message.includes('rate_limit')) {
        throw error; // Re-throw OpenAI errors as-is (already user-friendly)
      }

      throw new Error('Search failed. Please try again.');
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
