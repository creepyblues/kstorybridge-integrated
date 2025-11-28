import { supabase } from '@/lib/supabase';

export interface VectorSearchResult {
  title_id: string;
  title_name_en?: string;
  title_name_kr?: string;
  synopsis?: string;
  description?: string;
  genre?: string[];
  tone?: string;
  content_format?: string;
  title_image?: string;
  similarity: number;
}

export interface VectorSearchOptions {
  threshold?: number; // Minimum similarity score (0-1)
  limit?: number; // Maximum number of results
}

interface VectorSearchResponse {
  results: VectorSearchResult[];
  query: string;
  count: number;
  processing_time_ms: number;
  cost_estimate: number;
  error?: string;
}

/**
 * Vector Search Service for Dashboard
 *
 * Provides semantic search for titles using OpenAI embeddings
 * via the vector-search edge function.
 *
 * Performance: ~1-2 seconds (embedding generation + vector search)
 * Cost: ~$0.0001 per search
 */
class VectorSearchService {
  private readonly DEFAULT_MATCH_THRESHOLD = 0.4; // Cosine similarity threshold
  private readonly DEFAULT_RESULT_COUNT = 30; // Limit results for performance

  /**
   * Perform semantic vector search on titles
   *
   * @param query - Natural language search query (e.g., "romantic comedy set in Seoul")
   * @param options - Search options (threshold, limit)
   * @returns Array of matching titles sorted by similarity
   */
  async vectorSearch(
    query: string,
    options?: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    const startTime = Date.now();

    try {
      console.log(`🔍 Starting vector search for: "${query}"`);

      const threshold = options?.threshold || this.DEFAULT_MATCH_THRESHOLD;
      const limit = options?.limit || this.DEFAULT_RESULT_COUNT;

      console.log(`🔄 Calling vector-search edge function...`);

      // Call edge function (secure server-side embedding generation)
      const { data, error } = await supabase.functions.invoke<VectorSearchResponse>('vector-search', {
        body: {
          query,
          match_threshold: threshold,
          match_count: limit,
        },
      });

      if (error) {
        console.error('❌ Vector search edge function error:', error);
        throw new Error(`Vector search failed: ${error.message}`);
      }

      if (data?.error) {
        console.error('❌ Vector search returned error:', data.error);
        throw new Error(data.error);
      }

      const searchResults = data?.results || [];
      const searchDuration = Date.now() - startTime;

      console.log(`✅ Vector search complete: ${searchResults.length} results in ${searchDuration}ms`);
      if (data?.processing_time_ms) {
        console.log(`📊 Server processing time: ${data.processing_time_ms}ms`);
      }
      if (data?.cost_estimate) {
        console.log(`💰 Cost: $${data.cost_estimate.toFixed(6)}`);
      }

      if (searchResults.length > 0) {
        console.log(`📊 Similarity range: ${searchResults[0]?.similarity?.toFixed(3)} to ${searchResults[searchResults.length - 1]?.similarity?.toFixed(3)}`);
      }

      return searchResults;
    } catch (error: any) {
      const searchDuration = Date.now() - startTime;
      console.error(`❌ Vector search failed after ${searchDuration}ms:`, error);

      // Re-throw with user-friendly message
      if (error.message.includes('OpenAI')) {
        throw new Error('Search service unavailable. Please try again later.');
      } else if (error.message.includes('quota')) {
        throw new Error('Search quota exceeded. Please try again later.');
      } else if (error.message.includes('rate_limit')) {
        throw new Error('Too many searches. Please wait a moment and try again.');
      }

      throw new Error('Search failed. Please try again.');
    }
  }

  /**
   * Find similar titles to a given title
   *
   * @param titleId - UUID of the reference title
   * @param limit - Maximum number of similar titles to return
   * @returns Array of similar titles
   */
  async findSimilarTitles(
    titleId: string,
    limit: number = 10
  ): Promise<VectorSearchResult[]> {
    try {
      console.log(`🔍 Finding titles similar to: ${titleId}`);

      // Get the embedding for the reference title
      const { data: titleData, error: titleError } = await supabase
        .from('titles')
        .select('combined_embedding, title_name_en')
        .eq('title_id', titleId)
        .single();

      if (titleError || !titleData?.combined_embedding) {
        throw new Error('Reference title not found or has no embedding');
      }

      console.log(`✅ Found reference title: ${titleData.title_name_en}`);

      // Search for similar titles using the reference embedding
      const { data: results, error } = await supabase.rpc('match_titles_by_embedding', {
        query_embedding: titleData.combined_embedding,
        match_threshold: 0.5, // Higher threshold for similarity (more strict)
        match_count: limit + 1 // +1 to exclude the reference title itself
      });

      if (error) {
        throw new Error(`Failed to find similar titles: ${error.message}`);
      }

      // Filter out the reference title itself
      const similarTitles = (results || []).filter(
        (result: VectorSearchResult) => result.title_id !== titleId
      ).slice(0, limit);

      console.log(`✅ Found ${similarTitles.length} similar titles`);

      return similarTitles;
    } catch (error: any) {
      console.error('❌ Error finding similar titles:', error);
      throw error;
    }
  }

  /**
   * Get default search options
   */
  getDefaultOptions(): VectorSearchOptions {
    return {
      threshold: this.DEFAULT_MATCH_THRESHOLD,
      limit: this.DEFAULT_RESULT_COUNT
    };
  }
}

// Export singleton instance
export const vectorSearchService = new VectorSearchService();
