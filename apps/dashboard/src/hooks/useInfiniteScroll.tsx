import { useState, useEffect, useCallback, useRef } from 'react';
import { directApiService } from '@/services/directApiService';
import { Title } from '@/services/titlesService';
import { enhancedTitleSearchService } from '@/services/enhancedTitleSearchService';

interface UseInfiniteScrollProps {
  initialLimit?: number;
  loadMoreThreshold?: number; // pixels from bottom to trigger load
  useEnhancedSearch?: boolean; // Enable fuzzy search capabilities
  userId?: string; // For enhanced search analytics
}

interface InfiniteScrollState {
  titles: Title[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  total: number;
}

export function useInfiniteScroll({
  initialLimit = 12,
  loadMoreThreshold = 300,
  useEnhancedSearch = true,
  userId
}: UseInfiniteScrollProps = {}) {
  const [state, setState] = useState<InfiniteScrollState>({
    titles: [],
    loading: false,
    loadingMore: false,
    hasMore: true,
    error: null,
    total: 0
  });

  const currentPage = useRef(0);
  const currentSearchQuery = useRef<string>('');
  const isInitialized = useRef(false);
  const allTitlesCache = useRef<Title[]>([]); // Cache all titles for enhanced search
  const searchResultsCache = useRef<Map<string, Title[]>>(new Map()); // Cache search results

  // Load initial data
  const loadInitialData = useCallback(async (searchQuery: string = '') => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    currentSearchQuery.current = searchQuery;
    currentPage.current = 0;

    try {
      console.log('🔄 Loading initial titles with infinite scroll...', { searchQuery, useEnhancedSearch });

      if (useEnhancedSearch && searchQuery.trim()) {
        // Enhanced search mode: Use fuzzy search with cached titles
        console.log('🧠 Using enhanced search mode for query:', searchQuery);

        // Check if we have cached search results
        const cacheKey = searchQuery.toLowerCase().trim();
        if (searchResultsCache.current.has(cacheKey)) {
          const cachedResults = searchResultsCache.current.get(cacheKey)!;
          console.log('📋 Using cached search results:', cachedResults.length, 'titles');

          setState(prev => ({
            ...prev,
            titles: cachedResults.slice(0, initialLimit),
            hasMore: cachedResults.length > initialLimit,
            total: cachedResults.length,
            loading: false,
            error: null
          }));
          return;
        }

        // Load all titles if not cached
        if (allTitlesCache.current.length === 0) {
          console.log('📥 Loading all titles for enhanced search...');
          const allTitlesResult = await directApiService.getEnhancedPaginatedTitles(200, 0);
          allTitlesCache.current = allTitlesResult.titles;
        }

        // Apply enhanced search
        const searchResponse = await enhancedTitleSearchService.searchTitles(
          searchQuery,
          allTitlesCache.current,
          {
            useVectorSearch: false, // Disable vector search for performance
            maxResults: 50,
            userId: userId,
            hybridMode: true
          }
        );

        const searchResults = searchResponse.results.map(result => result.title);

        // Cache the results
        searchResultsCache.current.set(cacheKey, searchResults);

        setState(prev => ({
          ...prev,
          titles: searchResults.slice(0, initialLimit),
          hasMore: searchResults.length > initialLimit,
          total: searchResults.length,
          loading: false,
          error: null
        }));

        console.log('✅ Enhanced search completed:', searchResults.length, 'results, showing first', initialLimit);
      } else {
        // Traditional mode: Use basic search or load all titles
        const result = await directApiService.getPaginatedTitles(initialLimit, 0, searchQuery);

        setState(prev => ({
          ...prev,
          titles: result.titles,
          hasMore: result.hasMore,
          total: result.total,
          loading: false,
          error: null
        }));

        console.log('✅ Traditional search completed:', result.titles.length, 'titles, hasMore:', result.hasMore);
      }
    } catch (error) {
      console.error('❌ Failed to load initial titles:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load titles'
      }));
    }
  }, [initialLimit, useEnhancedSearch, userId]);

  // Load more data for infinite scroll
  const loadMore = useCallback(async () => {
    if (state.loading || state.loadingMore || !state.hasMore) {
      return;
    }

    setState(prev => ({ ...prev, loadingMore: true, error: null }));

    try {
      console.log('🔄 Loading more titles...', {
        currentTitles: state.titles.length,
        searchQuery: currentSearchQuery.current,
        useEnhancedSearch
      });

      if (useEnhancedSearch && currentSearchQuery.current.trim()) {
        // Enhanced search mode: Load more from cached search results
        const cacheKey = currentSearchQuery.current.toLowerCase().trim();
        const cachedResults = searchResultsCache.current.get(cacheKey);

        if (cachedResults) {
          const nextStartIndex = state.titles.length;
          const nextBatch = cachedResults.slice(nextStartIndex, nextStartIndex + initialLimit);

          setState(prev => ({
            ...prev,
            titles: [...prev.titles, ...nextBatch],
            hasMore: nextStartIndex + nextBatch.length < cachedResults.length,
            total: cachedResults.length,
            loadingMore: false,
            error: null
          }));

          console.log('✅ More enhanced search results loaded:', nextBatch.length, 'new titles');
        } else {
          // No cached results, shouldn't happen
          setState(prev => ({ ...prev, loadingMore: false, hasMore: false }));
        }
      } else {
        // Traditional mode: Load more from API
        const nextOffset = (currentPage.current + 1) * initialLimit;

        const result = await directApiService.getPaginatedTitles(
          initialLimit,
          nextOffset,
          currentSearchQuery.current
        );

        setState(prev => ({
          ...prev,
          titles: [...prev.titles, ...result.titles],
          hasMore: result.hasMore,
          total: nextOffset + result.titles.length,
          loadingMore: false,
          error: null
        }));

        currentPage.current += 1;
        console.log('✅ More traditional titles loaded:', result.titles.length, 'new titles, hasMore:', result.hasMore);
      }
    } catch (error) {
      console.error('❌ Failed to load more titles:', error);
      setState(prev => ({
        ...prev,
        loadingMore: false,
        error: error instanceof Error ? error.message : 'Failed to load more titles'
      }));
    }
  }, [state.loading, state.loadingMore, state.hasMore, state.titles.length, initialLimit, useEnhancedSearch]);

  // Scroll event handler
  const handleScroll = useCallback(() => {
    if (state.loading || state.loadingMore || !state.hasMore) {
      return;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - loadMoreThreshold;

    if (scrolledToBottom) {
      console.log('📜 Scroll threshold reached, loading more titles...');
      loadMore();
    }
  }, [state.loading, state.loadingMore, state.hasMore, loadMore, loadMoreThreshold]);

  // Search function that resets the scroll state
  const search = useCallback(async (searchQuery: string) => {
    console.log('🔍 Searching with infinite scroll:', searchQuery);
    await loadInitialData(searchQuery);
  }, [loadInitialData]);

  // Reset function to clear all data and restart
  const reset = useCallback(async () => {
    console.log('🔄 Resetting infinite scroll...');
    await loadInitialData('');
  }, [loadInitialData]);

  // Initialize data on mount
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      loadInitialData();
    }
  }, [loadInitialData]);

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return {
    titles: state.titles,
    loading: state.loading,
    loadingMore: state.loadingMore,
    hasMore: state.hasMore,
    error: state.error,
    total: state.total,
    loadMore,
    search,
    reset
  };
}