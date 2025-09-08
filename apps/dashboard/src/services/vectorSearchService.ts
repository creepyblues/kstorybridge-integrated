import { supabase } from '@/integrations/supabase/client';
import { embeddingService } from './embeddingService';
import { titlesService, type Title } from './titlesService';

export interface VectorSearchResult {
  title_id: string;
  title_name_en?: string;
  title_name_kr?: string;
  synopsis?: string;
  similarity: number;
  score?: number; // Additional computed score
}

export interface HybridSearchResult extends VectorSearchResult {
  text_score: number;
  vector_score: number;
  combined_score: number;
}

export interface SearchContext {
  user_id?: string;
  session_id?: string;
  preferences?: UserPreferences;
  filters?: SearchFilters;
}

export interface UserPreferences {
  preferred_genres?: string[];
  preferred_tones?: string[];
  preferred_formats?: string[];
  complexity_preference?: 'simple' | 'moderate' | 'complex';
  cultural_preference?: 'traditional' | 'modern' | 'mixed';
}

export interface SearchFilters {
  genres?: string[];
  tones?: string[];
  formats?: string[];
  completed_only?: boolean;
  has_pitch?: boolean;
  min_rating?: number;
  max_complexity?: number;
  content_warnings_exclude?: string[];
}

export interface SearchAnalytics {
  query: string;
  search_type: 'vector_only' | 'hybrid' | 'text_only';
  result_count: number;
  search_duration_ms: number;
  similarity_scores: number[];
  user_satisfaction?: number;
}

class VectorSearchService {
  private readonly DEFAULT_MATCH_THRESHOLD = 0.7;
  private readonly DEFAULT_RESULT_COUNT = 10;
  private readonly HYBRID_TEXT_WEIGHT = 0.3;
  private readonly HYBRID_VECTOR_WEIGHT = 0.7;

  // Pure vector similarity search
  async vectorSearch(
    query: string, 
    context?: SearchContext,
    options?: {
      threshold?: number;
      limit?: number;
      includeAnalysis?: boolean;
    }
  ): Promise<VectorSearchResult[]> {
    // Re-enabled with better error handling
    console.log('🔍 Vector search enabled - attempting with fallback handling');
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Starting vector search for: "${query}"`);

      // Generate real embedding for the search query
      console.log('🔄 Generating embedding for search query...');
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      if (!queryEmbedding) {
        throw new Error('Failed to generate query embedding');
      }

      // Perform vector similarity search
      const { data: results, error } = await supabase.rpc('match_titles_by_embedding', {
        query_embedding: queryEmbedding.embedding,
        match_threshold: options?.threshold || this.DEFAULT_MATCH_THRESHOLD,
        match_count: options?.limit || this.DEFAULT_RESULT_COUNT
      });

      if (error) {
        console.error('Vector search error:', error);
        throw new Error(`Vector search failed: ${error.message}`);
      }

      const searchResults = results || [];
      const searchDuration = Date.now() - startTime;

      console.log(`✅ Vector search completed: ${searchResults.length} results in ${searchDuration}ms`);

      // Record search analytics (only if we have a valid session ID)
      if (context?.session_id && this.isValidUUID(context.session_id)) {
        await this.recordSearchAnalytics({
          query,
          search_type: 'vector_only',
          result_count: searchResults.length,
          search_duration_ms: searchDuration,
          similarity_scores: searchResults.map(r => r.similarity)
        }, context);
      }

      // Apply additional filtering and ranking if context provided
      return this.enhanceSearchResults(searchResults, context, options?.includeAnalysis);
    } catch (error) {
      console.error('Vector search error:', error);
      
      // If it's a database schema error, provide helpful debugging
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.error('🗄️ Database schema issue - the vector search function may need to be updated');
        console.error('🔧 Consider running: npx supabase db reset --local');
      }
      
      // Re-throw the error so the calling code can handle fallback
      throw error;
    }
  }

  // Hybrid search (combines vector similarity with text search)
  async hybridSearch(
    query: string,
    context?: SearchContext,
    options?: {
      textWeight?: number;
      vectorWeight?: number;
      threshold?: number;
      limit?: number;
      includeAnalysis?: boolean;
    }
  ): Promise<HybridSearchResult[]> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Starting hybrid search for: "${query}"`);

      // Generate embedding for the search query
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      if (!queryEmbedding) {
        throw new Error('Failed to generate query embedding');
      }

      // Perform hybrid search
      const { data: results, error } = await supabase.rpc('hybrid_search_titles', {
        query_text: query,
        query_embedding: queryEmbedding.embedding,
        text_weight: options?.textWeight || this.HYBRID_TEXT_WEIGHT,
        vector_weight: options?.vectorWeight || this.HYBRID_VECTOR_WEIGHT,
        match_count: options?.limit || this.DEFAULT_RESULT_COUNT
      });

      if (error) {
        console.error('Hybrid search error:', error);
        throw new Error(`Hybrid search failed: ${error.message}`);
      }

      const searchResults = results || [];
      const searchDuration = Date.now() - startTime;

      console.log(`✅ Hybrid search completed: ${searchResults.length} results in ${searchDuration}ms`);

      // Record search analytics
      await this.recordSearchAnalytics({
        query,
        search_type: 'hybrid',
        result_count: searchResults.length,
        search_duration_ms: searchDuration,
        similarity_scores: searchResults.map(r => r.combined_score)
      }, context);

      // Apply additional filtering and ranking
      return this.enhanceHybridResults(searchResults, context, options?.includeAnalysis);
    } catch (error) {
      console.error('Hybrid search error:', error);
      throw error;
    }
  }

  // Semantic search with user preferences
  async personalizedSearch(
    query: string,
    userId: string,
    context?: SearchContext,
    options?: {
      limit?: number;
      includeAnalysis?: boolean;
    }
  ): Promise<VectorSearchResult[]> {
    try {
      console.log(`🎯 Starting personalized search for user: ${userId}`);

      // Load user preferences
      const userPreferences = await this.getUserPreferences(userId);
      
      // Enhance search context with preferences
      const enhancedContext: SearchContext = {
        ...context,
        user_id: userId,
        preferences: userPreferences
      };

      // Modify query based on user preferences
      const enhancedQuery = this.enhanceQueryWithPreferences(query, userPreferences);

      // Perform hybrid search with user context
      const results = await this.hybridSearch(enhancedQuery, enhancedContext, {
        ...options,
        textWeight: 0.2, // Reduce text weight for more semantic results
        vectorWeight: 0.8
      });

      // Apply personalization scoring
      return this.applyPersonalizationScoring(results, userPreferences);
    } catch (error) {
      console.error('Personalized search error:', error);
      throw error;
    }
  }

  // Find similar titles to a given title
  async findSimilarTitles(
    titleId: string,
    options?: {
      limit?: number;
      threshold?: number;
      includeAnalysis?: boolean;
    }
  ): Promise<VectorSearchResult[]> {
    try {
      console.log(`🔗 Finding similar titles to: ${titleId}`);

      // Get the source title's embedding
      const { data: sourceTitle, error } = await supabase
        .from('titles')
        .select('title_id, title_name_en, title_name_kr, combined_embedding')
        .eq('title_id', titleId)
        .single();

      if (error || !sourceTitle || !sourceTitle.combined_embedding) {
        throw new Error('Source title not found or missing embedding');
      }

      // Search for similar titles using the source embedding
      const { data: results, error: searchError } = await supabase.rpc('match_titles_by_embedding', {
        query_embedding: sourceTitle.combined_embedding,
        match_threshold: options?.threshold || this.DEFAULT_MATCH_THRESHOLD,
        match_count: (options?.limit || this.DEFAULT_RESULT_COUNT) + 1 // +1 to exclude source
      });

      if (searchError) {
        throw new Error(`Similar titles search failed: ${searchError.message}`);
      }

      // Filter out the source title itself
      const similarTitles = (results || []).filter(result => result.title_id !== titleId);

      console.log(`✅ Found ${similarTitles.length} similar titles`);
      return similarTitles;
    } catch (error) {
      console.error('Find similar titles error:', error);
      throw error;
    }
  }

  // Smart content recommendation based on user behavior
  async getRecommendations(
    userId: string,
    options?: {
      limit?: number;
      diversityFactor?: number; // 0-1, higher = more diverse recommendations
      freshnessFactor?: number; // 0-1, higher = prefer newer content
    }
  ): Promise<VectorSearchResult[]> {
    try {
      console.log(`💡 Generating recommendations for user: ${userId}`);

      // Get user interaction history
      const userHistory = await this.getUserInteractionHistory(userId);
      
      if (userHistory.length === 0) {
        // New user - return popular/trending content
        return this.getTrendingContent(options?.limit);
      }

      // Analyze user preferences from history
      const implicitPreferences = this.analyzeUserBehavior(userHistory);

      // Generate recommendations based on implicit preferences
      const recommendations = await this.generateImplicitRecommendations(
        implicitPreferences,
        options
      );

      console.log(`✅ Generated ${recommendations.length} recommendations`);
      return recommendations;
    } catch (error) {
      console.error('Get recommendations error:', error);
      throw error;
    }
  }

  // Enhanced search results with additional context
  private async enhanceSearchResults(
    results: VectorSearchResult[],
    context?: SearchContext,
    includeAnalysis: boolean = false
  ): Promise<VectorSearchResult[]> {
    if (!includeAnalysis || results.length === 0) {
      return results;
    }

    try {
      // Get additional analysis data for titles
      const titleIds = results.map(r => r.title_id);
      const { data: analyses } = await supabase
        .from('title_content_analysis')
        .select('title_id, semantic_tags, mood_analysis, complexity_score, target_demographics')
        .in('title_id', titleIds);

      // Enhance results with analysis data
      return results.map(result => {
        const analysis = analyses?.find(a => a.title_id === result.title_id);
        return {
          ...result,
          analysis: analysis || null
        };
      });
    } catch (error) {
      console.error('Error enhancing search results:', error);
      return results;
    }
  }

  private async enhanceHybridResults(
    results: HybridSearchResult[],
    context?: SearchContext,
    includeAnalysis: boolean = false
  ): Promise<HybridSearchResult[]> {
    // Apply user preference boosting if available
    if (context?.preferences) {
      return this.applyPreferenceBoost(results, context.preferences);
    }

    return results;
  }

  // Apply user preferences to boost relevant results
  private applyPreferenceBoost(
    results: HybridSearchResult[],
    preferences: UserPreferences
  ): HybridSearchResult[] {
    return results.map(result => {
      let boostFactor = 1.0;

      // This would typically involve loading title metadata and comparing with preferences
      // For now, using placeholder logic
      
      return {
        ...result,
        combined_score: result.combined_score * boostFactor
      };
    }).sort((a, b) => b.combined_score - a.combined_score);
  }

  // Record search analytics
  private async recordSearchAnalytics(
    analytics: SearchAnalytics,
    context?: SearchContext
  ): Promise<void> {
    if (!context?.user_id) return;

    try {
      // Handle session_id - if it's not a UUID, skip recording or create a proper UUID
      let sessionId = context.session_id;
      
      // Check if session_id is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!sessionId || !uuidRegex.test(sessionId)) {
        console.warn('⚠️ Invalid session_id format, skipping analytics recording:', sessionId);
        return;
      }

      const { error } = await supabase
        .from('vector_search_analytics')
        .insert({
          user_id: context.user_id,
          session_id: sessionId,
          query: analytics.query,
          search_type: analytics.search_type,
          result_count: analytics.result_count,
          search_duration_ms: analytics.search_duration_ms
        });

      if (error) {
        console.error('Error recording search analytics:', error);
      } else {
        console.log('✅ Vector search analytics recorded:', analytics.query);
      }
    } catch (error) {
      console.error('Exception recording search analytics:', error);
    }
  }

  // Get user preferences (placeholder - would integrate with user preference system)
  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    // This would typically load from a user preferences table
    // For now, returning default preferences
    return {
      preferred_genres: [],
      preferred_tones: [],
      preferred_formats: [],
      complexity_preference: 'moderate',
      cultural_preference: 'mixed'
    };
  }

  // Enhance query with user preferences
  private enhanceQueryWithPreferences(query: string, preferences: UserPreferences): string {
    let enhancedQuery = query;

    // Add preferred genres if not already mentioned
    if (preferences.preferred_genres && preferences.preferred_genres.length > 0) {
      const genreText = preferences.preferred_genres.join(' ');
      if (!query.toLowerCase().includes(genreText.toLowerCase())) {
        enhancedQuery += ` ${genreText}`;
      }
    }

    // Add complexity preference
    if (preferences.complexity_preference) {
      enhancedQuery += ` ${preferences.complexity_preference} complexity`;
    }

    return enhancedQuery;
  }

  // Apply personalization scoring
  private applyPersonalizationScoring(
    results: HybridSearchResult[],
    preferences: UserPreferences
  ): VectorSearchResult[] {
    return results.map(result => ({
      title_id: result.title_id,
      title_name_en: result.title_name_en,
      title_name_kr: result.title_name_kr,
      synopsis: result.synopsis,
      similarity: result.vector_score,
      score: result.combined_score
    }));
  }

  // Get user interaction history (placeholder)
  private async getUserInteractionHistory(userId: string): Promise<any[]> {
    // This would load from chat_interactions table
    return [];
  }

  // Analyze user behavior patterns
  private analyzeUserBehavior(history: any[]): any {
    // This would analyze click patterns, preferences, etc.
    return {};
  }

  // Generate recommendations based on implicit preferences
  private async generateImplicitRecommendations(
    preferences: any,
    options?: any
  ): Promise<VectorSearchResult[]> {
    // This would generate recommendations based on user behavior
    return [];
  }

  // Get trending content for new users
  private async getTrendingContent(limit: number = 10): Promise<VectorSearchResult[]> {
    try {
      const { data: trending, error } = await supabase
        .from('titles')
        .select('title_id, title_name_en, title_name_kr, synopsis, views, likes')
        .not('combined_embedding', 'is', null)
        .order('views', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (trending || []).map(title => ({
        title_id: title.title_id,
        title_name_en: title.title_name_en,
        title_name_kr: title.title_name_kr,
        synopsis: title.synopsis,
        similarity: 0.8, // Default similarity for trending
        score: title.views || 0
      }));
    } catch (error) {
      console.error('Error getting trending content:', error);
      return [];
    }
  }

  // UUID validation helper
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Health check and status
  async getSearchStatus(): Promise<{
    vector_search_enabled: boolean;
    total_indexed_titles: number;
    embedding_model: string;
    last_processing_date: string | null;
  }> {
    try {
      const { data: stats, error } = await supabase
        .from('titles')
        .select('title_id, combined_embedding, embedding_updated_at')
        .not('combined_embedding', 'is', null);

      if (error) {
        throw error;
      }

      const indexedCount = stats?.length || 0;
      const lastProcessed = stats
        ?.map(s => s.embedding_updated_at)
        .filter(Boolean)
        .sort()
        .pop() || null;

      return {
        vector_search_enabled: indexedCount > 0,
        total_indexed_titles: indexedCount,
        embedding_model: 'text-embedding-ada-002',
        last_processing_date: lastProcessed
      };
    } catch (error) {
      console.error('Error getting search status:', error);
      return {
        vector_search_enabled: false,
        total_indexed_titles: 0,
        embedding_model: 'text-embedding-ada-002',
        last_processing_date: null
      };
    }
  }
}

export const vectorSearchService = new VectorSearchService();