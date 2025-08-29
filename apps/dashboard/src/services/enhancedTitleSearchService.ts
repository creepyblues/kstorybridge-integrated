import { vectorSearchService } from './vectorSearchService';
import { titlesService, type Title } from './titlesService';
import { enhancedSearch, getTitleSearchFields } from '@/utils/searchUtils';

export interface SearchResult {
  title: Title;
  score: number;
  matchType: 'vector' | 'exact' | 'phrase' | 'expanded';
  similarity?: number;
}

export interface SearchOptions {
  useVectorSearch?: boolean;
  vectorThreshold?: number;
  maxResults?: number;
  userId?: string;
  hybridMode?: boolean; // Combine vector and traditional search
}

export interface SearchResponse {
  results: SearchResult[];
  searchType: 'vector' | 'traditional' | 'hybrid';
  totalResults: number;
  searchTime: number;
  vectorSearchUsed: boolean;
}

class EnhancedTitleSearchService {
  private readonly DEFAULT_VECTOR_THRESHOLD = 0.65;
  private readonly DEFAULT_MAX_RESULTS = 50;
  private readonly HYBRID_BOOST_FACTOR = 1.2; // Boost factor for titles that match both vector and traditional search

  /**
   * Perform enhanced search with vector search capabilities
   */
  async searchTitles(
    query: string, 
    titles: Title[], 
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const {
      useVectorSearch = true,
      vectorThreshold = this.DEFAULT_VECTOR_THRESHOLD,
      maxResults = this.DEFAULT_MAX_RESULTS,
      userId,
      hybridMode = true
    } = options;

    if (!query.trim()) {
      return {
        results: titles.slice(0, maxResults).map(title => ({
          title,
          score: 0,
          matchType: 'exact' as const
        })),
        searchType: 'traditional',
        totalResults: titles.length,
        searchTime: Date.now() - startTime,
        vectorSearchUsed: false
      };
    }

    let vectorResults: SearchResult[] = [];
    let traditionalResults: SearchResult[] = [];
    let vectorSearchUsed = false;

    try {
      // Try vector search if enabled and available
      if (useVectorSearch) {
        console.log('🔍 Attempting vector search for titles page');
        
        const vectorSearchResults = await vectorSearchService.vectorSearch(query, {
          user_id: userId,
          session_id: `search-${Date.now()}`,
        }, {
          threshold: vectorThreshold,
          limit: maxResults,
          includeAnalysis: true
        });

        if (vectorSearchResults && vectorSearchResults.length > 0) {
          console.log(`✅ Vector search found ${vectorSearchResults.length} results`);
          vectorSearchUsed = true;

          // Convert vector results to SearchResult format
          const titleMap = new Map(titles.map(title => [title.title_id, title]));
          
          vectorResults = vectorSearchResults
            .map(result => {
              const title = titleMap.get(result.title_id);
              if (!title) return null;
              
              return {
                title,
                score: Math.round(result.similarity * 100),
                matchType: 'vector' as const,
                similarity: result.similarity
              };
            })
            .filter(Boolean) as SearchResult[];
        }
      }
    } catch (error) {
      console.warn('⚠️ Vector search failed, using traditional search:', error);
      vectorSearchUsed = false;
    }

    // Perform traditional search
    const { exactMatches, phraseMatches, expandedMatches } = enhancedSearch(
      titles,
      query,
      getTitleSearchFields()
    );

    // Convert traditional results to SearchResult format
    const convertToSearchResults = (matches: Title[], matchType: 'exact' | 'phrase' | 'expanded'): SearchResult[] => {
      const scoreMap = {
        'exact': 100,
        'phrase': 80,
        'expanded': 60
      };

      return matches.map(title => ({
        title,
        score: scoreMap[matchType],
        matchType
      }));
    };

    traditionalResults = [
      ...convertToSearchResults(exactMatches, 'exact'),
      ...convertToSearchResults(phraseMatches, 'phrase'),
      ...convertToSearchResults(expandedMatches, 'expanded')
    ];

    // Determine final results based on search strategy
    let finalResults: SearchResult[];
    let searchType: 'vector' | 'traditional' | 'hybrid';

    if (vectorSearchUsed && hybridMode && traditionalResults.length > 0) {
      // Hybrid mode: combine and boost titles that appear in both results
      finalResults = this.combineHybridResults(vectorResults, traditionalResults);
      searchType = 'hybrid';
    } else if (vectorSearchUsed && vectorResults.length > 0) {
      // Pure vector search
      finalResults = vectorResults.slice(0, maxResults);
      searchType = 'vector';
    } else {
      // Traditional search
      finalResults = traditionalResults.slice(0, maxResults);
      searchType = 'traditional';
    }

    const searchTime = Date.now() - startTime;
    
    console.log(`🎯 Search completed: ${finalResults.length} results in ${searchTime}ms (${searchType})`);

    return {
      results: finalResults,
      searchType,
      totalResults: finalResults.length,
      searchTime,
      vectorSearchUsed
    };
  }

  /**
   * Combine vector and traditional search results with hybrid scoring
   */
  private combineHybridResults(vectorResults: SearchResult[], traditionalResults: SearchResult[]): SearchResult[] {
    const resultMap = new Map<string, SearchResult>();

    // Add vector results
    vectorResults.forEach(result => {
      resultMap.set(result.title.title_id, result);
    });

    // Add traditional results and boost scores for titles that appear in both
    traditionalResults.forEach(result => {
      const existing = resultMap.get(result.title.title_id);
      if (existing) {
        // Title appears in both - boost the score
        existing.score = Math.round((existing.score + result.score) * this.HYBRID_BOOST_FACTOR);
        existing.matchType = 'vector'; // Keep vector as primary match type
      } else {
        // Title only in traditional search
        resultMap.set(result.title.title_id, result);
      }
    });

    // Sort by score (highest first) and return
    return Array.from(resultMap.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get search status and capabilities
   */
  async getSearchCapabilities(): Promise<{
    vectorSearchAvailable: boolean;
    totalIndexedTitles: number;
    searchStatus: Record<string, unknown> | null;
  }> {
    try {
      const status = await vectorSearchService.getSearchStatus();
      return {
        vectorSearchAvailable: status.vector_search_enabled,
        totalIndexedTitles: status.total_indexed_titles,
        searchStatus: status
      };
    } catch (error) {
      return {
        vectorSearchAvailable: false,
        totalIndexedTitles: 0,
        searchStatus: null
      };
    }
  }

  /**
   * Search with genre and filter combinations
   */
  async searchWithFilters(
    query: string,
    titles: Title[],
    filters: {
      showOnlyWithPitch?: boolean;
      activeGenreFilter?: string | null;
    },
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    // Apply filters first
    let filteredTitles = titles;
    
    if (filters.showOnlyWithPitch) {
      filteredTitles = filteredTitles.filter(title => title.pitch && title.pitch.trim() !== '');
    }
    
    if (filters.activeGenreFilter) {
      // Apply genre filter using traditional search to maintain existing behavior
      const genreSearchResults = enhancedSearch(
        filteredTitles,
        filters.activeGenreFilter,
        getTitleSearchFields()
      );
      filteredTitles = [
        ...genreSearchResults.exactMatches,
        ...genreSearchResults.phraseMatches,
        ...genreSearchResults.expandedMatches
      ];
    }

    // Perform search on filtered titles
    return this.searchTitles(query, filteredTitles, options);
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query.trim() || query.length < 2) return [];

    try {
      // Use vector search to find similar content and extract keywords
      const results = await vectorSearchService.vectorSearch(query, {}, {
        threshold: 0.5,
        limit: 10
      });

      const suggestions: Set<string> = new Set();
      
      results.forEach(result => {
        // Extract keywords from title names
        const titleWords = [result.title_name_en, result.title_name_kr]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 2);
        
        titleWords.forEach(word => {
          if (word.includes(query.toLowerCase()) || query.toLowerCase().includes(word)) {
            suggestions.add(word);
          }
        });
      });

      return Array.from(suggestions).slice(0, 5);
    } catch (error) {
      console.warn('Failed to get search suggestions:', error);
      return [];
    }
  }
}

export const enhancedTitleSearchService = new EnhancedTitleSearchService();