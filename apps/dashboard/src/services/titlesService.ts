import { supabase } from '@/lib/supabase';
import { type PitchAnalysis } from '@/types/pitchAnalysis';
import { vectorSearchService, type VectorSearchResult } from './vectorSearchService';

// Character detail structure from creator questionnaire
export interface CharacterDetail {
  name: string;
  name_kr?: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'romantic_foil' | 'romantic_false_foil';
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
  slug?: string;

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
  synopsis_kr?: string;
  description?: string;
  tagline?: string;
  tagline_kr?: string;
  note?: string;
  note_kr?: string;

  // Business & Rights
  rights?: string;
  rights_available?: string[];
  rights_holder_name?: string;
  rights_holder_company?: string;
  cp?: string;
  pitch?: string;
  selling_points?: string;
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
  prioritizeTitleName?: boolean; // For admin searches - title name matches appear first
  /**
   * When true, returns titles regardless of priority. Admin-only callers
   * (AdminTitles, WeeklyTitle, Trending, admin detail views) should set this
   * to true. Default (false/undefined) hides priority = '3' / null titles so
   * Low-priority entries never reach the buyer dashboard.
   */
  includeAllPriorities?: boolean;
}

/**
 * Priority encoding (string column on `titles`):
 *   '1' = High   → visible on dashboard
 *   '2' = Medium → visible on dashboard
 *   '3' = Low    → hidden on dashboard (treated as unpublished)
 *   null/missing → also treated as Low (matches the AdminTitles UI default)
 *
 * Buyer-facing queries should call applyPublishedFilter on the query
 * builder; admin callers opt out via filters.includeAllPriorities = true.
 */
const PUBLISHED_PRIORITIES = ['1', '2'];

/**
 * Adds the `priority IN ('1', '2')` filter to a Supabase query.
 * Typed loosely as `any` because the PostgrestFilterBuilder's generics are
 * deep enough that wrapping them in a constrained generic trips TS 2589.
 */
function applyPublishedFilter(query: any): any {
  return query.in('priority', PUBLISHED_PRIORITIES);
}

class TitlesService {
  /**
   * Fetch all titles with optional filters
   */
  async getTitles(filters?: TitleFilters): Promise<Title[]> {
    try {
      // Special handling for admin searches that prioritize title name matches
      if (filters?.search && filters?.prioritizeTitleName) {
        return this.getTitlesWithTitleNamePriority(filters);
      }

      let query = supabase
        .from('titles')
        .select('*')
        .order('priority', { ascending: true })
        .order('verified', { ascending: false })
        .order('views', { ascending: false, nullsFirst: false });

      // Hide priority='3'/null from buyer surfaces unless admin opted out.
      if (!filters?.includeAllPriorities) {
        query = applyPublishedFilter(query);
      }

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
   * Fetch titles with title name matches prioritized over synopsis matches.
   * Used for admin searches where users typically search by title name.
   */
  private async getTitlesWithTitleNamePriority(filters: TitleFilters): Promise<Title[]> {
    const searchTerm = filters.search!;

    // First query: titles where name matches the search
    let titleNameQuery = supabase
      .from('titles')
      .select('*')
      .or(`title_name_en.ilike.%${searchTerm}%,title_name_kr.ilike.%${searchTerm}%`)
      .order('priority', { ascending: true })
      .order('verified', { ascending: false })
      .order('views', { ascending: false, nullsFirst: false });

    if (!filters.includeAllPriorities) {
      titleNameQuery = applyPublishedFilter(titleNameQuery);
    }

    // Apply other filters
    if (filters.genre) {
      titleNameQuery = titleNameQuery.contains('genre', [filters.genre]);
    }
    if (filters.format) {
      titleNameQuery = titleNameQuery.eq('content_format', filters.format);
    }
    if (filters.minRating !== undefined) {
      titleNameQuery = titleNameQuery.gte('rating', filters.minRating);
    }
    if (filters.completed !== undefined) {
      titleNameQuery = titleNameQuery.eq('completed', filters.completed);
    }

    const { data: titleMatches, error: titleError } = await titleNameQuery;

    if (titleError) {
      console.error('❌ Error fetching title name matches:', titleError);
      throw new Error(`Failed to fetch titles: ${titleError.message}`);
    }

    // Get IDs of title name matches to exclude from synopsis search
    const titleMatchIds = (titleMatches || []).map(t => t.title_id);

    // Second query: titles where synopsis or genre matches, but not title name
    let synopsisQuery = supabase
      .from('titles')
      .select('*')
      .or(`synopsis.ilike.%${searchTerm}%,genre.cs.{${searchTerm}}`)
      .order('priority', { ascending: true })
      .order('verified', { ascending: false })
      .order('views', { ascending: false, nullsFirst: false });

    if (!filters.includeAllPriorities) {
      synopsisQuery = applyPublishedFilter(synopsisQuery);
    }

    // Apply other filters
    if (filters.genre) {
      synopsisQuery = synopsisQuery.contains('genre', [filters.genre]);
    }
    if (filters.format) {
      synopsisQuery = synopsisQuery.eq('content_format', filters.format);
    }
    if (filters.minRating !== undefined) {
      synopsisQuery = synopsisQuery.gte('rating', filters.minRating);
    }
    if (filters.completed !== undefined) {
      synopsisQuery = synopsisQuery.eq('completed', filters.completed);
    }

    const { data: synopsisMatches, error: synopsisError } = await synopsisQuery;

    if (synopsisError) {
      console.error('❌ Error fetching synopsis matches:', synopsisError);
      throw new Error(`Failed to fetch titles: ${synopsisError.message}`);
    }

    // Filter out synopsis matches that are already in title matches
    const uniqueSynopsisMatches = (synopsisMatches || []).filter(
      t => !titleMatchIds.includes(t.title_id)
    );

    // Combine: title name matches first, then synopsis-only matches
    return [...(titleMatches || []), ...uniqueSynopsisMatches];
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
        .order('priority', { ascending: true })
        .order('verified', { ascending: false })
        .order('views', { ascending: false, nullsFirst: false });

      if (!filters?.includeAllPriorities) {
        query = applyPublishedFilter(query);
      }

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
   * Fetch multiple titles by their IDs.
   * Hides priority=Low entries by default; pass includeAllPriorities=true
   * for admin contexts that need every row regardless of priority.
   */
  async getTitlesByIds(titleIds: string[], options?: { includeAllPriorities?: boolean }): Promise<Title[]> {
    if (titleIds.length === 0) return [];

    try {
      let query = supabase
        .from('titles')
        .select('*')
        .in('title_id', titleIds);

      if (!options?.includeAllPriorities) {
        query = applyPublishedFilter(query);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching titles by IDs:', error);
        throw new Error(`Failed to fetch titles: ${error.message}`);
      }

      // Sort results to match the order of input IDs
      const titleMap = new Map((data || []).map(t => [t.title_id, t]));
      return titleIds
        .map(id => titleMap.get(id))
        .filter((t): t is Title => t !== undefined);
    } catch (error: any) {
      console.error('❌ Titles by IDs service error:', error);
      throw error;
    }
  }

  /**
   * Fetch a single title by ID with pitch analysis, platforms, and documents.
   * Uses multiple queries for better reliability.
   *
   * The detail page renders a title regardless of priority — Low/null titles
   * are "unlisted" (hidden from lists, search, AI tools, and the pitch PDF) but
   * reachable by direct link. List/search surfaces apply their own priority
   * filter; this single-row fetch does not.
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
   * Fetch a single title by slug with pitch analysis, platforms, and documents.
   * Renders regardless of priority, same as getTitleById.
   */
  async getTitleBySlug(slug: string): Promise<Title | null> {
    try {
      // Backward compatibility: if slug is actually a UUID, fetch by ID directly
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(slug)) {
        return this.getTitleById(slug);
      }

      const { data, error } = await supabase
        .from('titles')
        .select('title_id')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error('❌ Error resolving slug:', error);
        throw new Error(`Failed to resolve slug: ${error.message}`);
      }

      if (!data) {
        console.log('ℹ️ Title not found for slug:', slug);
        return null;
      }

      return this.getTitleById(data.title_id);
    } catch (error: unknown) {
      console.error('❌ Title by slug service error:', error);
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
   * Get all favorited titles for a user. Buyer-only surface — Low-priority
   * titles are filtered out even if the user previously saved one.
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

      // Extract titles, drop any whose priority is Low (or unset)
      const titles = data?.map((fav: any) => fav.title).filter(Boolean) || [];
      return titles.filter(
        (t: Title) => t.priority === '1' || t.priority === '2',
      );
    } catch (error: any) {
      console.error('❌ Favorites service error:', error);
      throw error;
    }
  }

  /**
   * Get unique genres from all titles. Buyer dropdown — scoped to published
   * titles only so we don't surface options that have zero visible titles.
   */
  async getGenres(): Promise<string[]> {
    try {
      const { data, error } = await applyPublishedFilter(
        supabase.from('titles').select('genre').not('genre', 'is', null),
      );

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
   * Get unique content formats from all titles. Buyer dropdown — scoped to
   * published titles only so we don't surface options that have zero
   * visible titles.
   */
  async getFormats(): Promise<string[]> {
    try {
      const { data, error } = await applyPublishedFilter(
        supabase.from('titles').select('content_format').not('content_format', 'is', null),
      );

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

      // Fetch full title data, hiding Low-priority titles from the buyer surface.
      const { data, error } = await applyPublishedFilter(
        supabase.from('titles').select('*').in('title_id', titleIds),
      );

      if (error) {
        console.error('❌ Error fetching title details:', error);
        throw new Error(`Failed to fetch title details: ${error.message}`);
      }

      // Sort results by vector similarity order (preserve relevance ranking)
      const dataTyped = (data ?? []) as Title[];
      const sortedTitles = titleIds
        .map(id => dataTyped.find(title => title.title_id === id))
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
      console.log('📤 titlesService.updateTitle called');
      console.log('   titleId:', titleId);
      console.log('   updates:', JSON.stringify(updates, null, 2));

      const { data, error } = await supabase
        .from('titles')
        .update(updates)
        .eq('title_id', titleId)
        .select();

      console.log('📥 Supabase response:');
      console.log('   data:', data);
      console.log('   error:', error);

      if (error) {
        console.error('❌ Error updating title:', error);
        throw new Error(`Failed to update title: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No rows updated - check RLS policies or title_id');
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

  /**
   * Audit summary counts for the four admin cards.
   * - missing_url: title_url IS NULL (Korean source URL is the primary one)
   * - missing_image: title_image IS NULL
   * - missing_comps: comps_analysis is null OR empty array
   * - missing_format_fit: no row in title_format_fit
   * - mismatches: title_audits rows where name_match_kr=false OR name_match_en=false OR image_reachable=false
   */
  async getAuditSummary(): Promise<{
    total: number;
    missing_url: number;
    missing_image: number;
    missing_comps: number;
    missing_format_fit: number;
    mismatches: number;
    audited: number;
  }> {
    const [totalRes, missUrlRes, missImgRes, missCompsRes, formatFitRes, mismatchRes, auditedRes] =
      await Promise.all([
        supabase.from('titles').select('title_id', { count: 'exact', head: true }),
        supabase
          .from('titles')
          .select('title_id', { count: 'exact', head: true })
          .is('title_url', null),
        supabase
          .from('titles')
          .select('title_id', { count: 'exact', head: true })
          .is('title_image', null),
        supabase
          .from('titles')
          .select('title_id', { count: 'exact', head: true })
          .is('comps_analysis', null),
        supabase.from('title_format_fit').select('title_id', { count: 'exact', head: true }),
        supabase
          .from('title_audits')
          .select('title_id', { count: 'exact', head: true })
          .or('name_match_kr.eq.false,name_match_en.eq.false,image_reachable.eq.false'),
        supabase.from('title_audits').select('title_id', { count: 'exact', head: true }),
      ]);

    const total = totalRes.count ?? 0;
    const formatFitRows = formatFitRes.count ?? 0;

    return {
      total,
      missing_url: missUrlRes.count ?? 0,
      missing_image: missImgRes.count ?? 0,
      missing_comps: missCompsRes.count ?? 0,
      missing_format_fit: Math.max(0, total - formatFitRows),
      mismatches: mismatchRes.count ?? 0,
      audited: auditedRes.count ?? 0,
    };
  }

  /**
   * Fetch title_ids for a given audit filter. Returns just the IDs;
   * the caller filters the in-memory titles list to render.
   */
  async getTitleIdsByAuditFilter(
    filter:
      | 'missing_url'
      | 'missing_image'
      | 'missing_comps'
      | 'missing_format_fit'
      | 'name_mismatch'
      | 'image_unreachable'
      | 'never_audited',
  ): Promise<string[]> {
    if (filter === 'missing_url') {
      const { data, error } = await supabase.from('titles').select('title_id').is('title_url', null);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => r.title_id);
    }
    if (filter === 'missing_image') {
      const { data, error } = await supabase
        .from('titles')
        .select('title_id')
        .is('title_image', null);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => r.title_id);
    }
    if (filter === 'missing_comps') {
      const { data, error } = await supabase
        .from('titles')
        .select('title_id')
        .is('comps_analysis', null);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => r.title_id);
    }
    if (filter === 'missing_format_fit') {
      // Titles minus titles-with-format-fit-row
      const [{ data: allTitles, error: tErr }, { data: ffRows, error: ffErr }] = await Promise.all([
        supabase.from('titles').select('title_id'),
        supabase.from('title_format_fit').select('title_id'),
      ]);
      if (tErr) throw new Error(tErr.message);
      if (ffErr) throw new Error(ffErr.message);
      const withFF = new Set((ffRows ?? []).map((r) => r.title_id as string));
      return (allTitles ?? []).map((r) => r.title_id).filter((id) => !withFF.has(id));
    }
    if (filter === 'name_mismatch') {
      const { data, error } = await supabase
        .from('title_audits')
        .select('title_id')
        .or('name_match_kr.eq.false,name_match_en.eq.false');
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => r.title_id);
    }
    if (filter === 'image_unreachable') {
      const { data, error } = await supabase
        .from('title_audits')
        .select('title_id')
        .eq('image_reachable', false);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => r.title_id);
    }
    // never_audited
    const [{ data: allTitles, error: tErr }, { data: audits, error: aErr }] = await Promise.all([
      supabase.from('titles').select('title_id'),
      supabase.from('title_audits').select('title_id'),
    ]);
    if (tErr) throw new Error(tErr.message);
    if (aErr) throw new Error(aErr.message);
    const audited = new Set((audits ?? []).map((r) => r.title_id as string));
    return (allTitles ?? []).map((r) => r.title_id).filter((id) => !audited.has(id));
  }
}

export const titlesService = new TitlesService();
