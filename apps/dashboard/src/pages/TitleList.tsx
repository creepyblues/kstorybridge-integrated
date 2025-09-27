import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

import { Search, RefreshCw, ChevronUp, ChevronDown, ArrowUpDown, LayoutGrid, List as ListIcon } from "lucide-react";
import { Button, Card, CardContent, useToast } from "@kstorybridge/ui";
import { titlesService, type Title } from "@/services/titlesService";

import { useAuth } from "@/hooks/useAuth";
import { useSessionCache } from "@/hooks/useSessionCache";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import OptimizedTierGatedContent from "@/components/OptimizedTierGatedContent";
import { TierProvider } from "@/contexts/TierContext";
import { enhancedSearch, getTitleSearchFields } from "@/utils/searchUtils";
import { enhancedTitleSearchService, type SearchResult } from "@/services/enhancedTitleSearchService";
import { useDataCache } from "@/contexts/DataCacheContext";
import { trackSearch } from "@/utils/analytics";
import { directApiService } from "@/services/directApiService";
import { PageContainer } from "@/components/layout/PageContainer";

function TitleListContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const {
    getCreatorTitles,
    setCreatorTitles,
    isFresh,
    isSessionValid,
    getDbConnectivityStatus,
    setDbConnectivityStatus,
    refreshData,
    clearCache
  } = useDataCache();
  const { } = useSessionCache(); // Initialize session cache management

  // Determine if this is creator view based on route
  const isCreatorView = location.pathname.startsWith('/creators');
  const isBuyerView = location.pathname.startsWith('/buyers');

  // Use infinite scroll for buyers, traditional loading for creators
  const infiniteScroll = useInfiniteScroll({
    initialLimit: 12, // Load only 12 titles initially for faster page performance
    loadMoreThreshold: 300,
    useEnhancedSearch: false, // Disable enhanced search for normal browsing to fix infinite scroll
    userId: user?.id
  });

  const [searchQuery, setSearchQuery] = useState(""); // What user types
  const [searchTerm, setSearchTerm] = useState(""); // What's actually searched/filtered
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const currentSearchId = useRef<string | null>(null);
  const [sortField, setSortField] = useState<string | null>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dbError, setDbError] = useState<string | null>(null);

  // Pagination state for creators only
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Enhanced search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchType, setSearchType] = useState<'vector' | 'traditional' | 'hybrid'>('traditional');
  const [vectorSearchAvailable, setVectorSearchAvailable] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card'); // Default to card view

  // Get creator titles from cache for creator view, use infinite scroll for buyers
  const creatorTitles = isCreatorView ? getCreatorTitles() : [];
  const buyerTitles = isBuyerView ? infiniteScroll.titles : [];
  const titles = isCreatorView ? creatorTitles : buyerTitles;
  const dbStatus = getDbConnectivityStatus();

  useEffect(() => {
    // For creator view: load from cache if needed
    // For buyer view: infinite scroll handles loading automatically
    if (isCreatorView) {
      const dataKey = 'creatorTitles';
      if (user && (!isSessionValid() || creatorTitles.length === 0 || !isFresh(dataKey))) {
        loadCreatorData();
      }
    }
  }, [isCreatorView, user, isSessionValid]); // Depend on session validity

  // Check vector search capabilities
  useEffect(() => {
    const checkVectorCapabilities = async () => {
      try {
        const capabilities = await enhancedTitleSearchService.getSearchCapabilities();
        setVectorSearchAvailable(capabilities.vectorSearchAvailable);
        console.log(`🔍 Vector search available: ${capabilities.vectorSearchAvailable} (${capabilities.totalIndexedTitles} titles indexed)`);
      } catch (error) {
        console.warn('Failed to check vector search capabilities:', error);
        setVectorSearchAvailable(false);
      }
    };

    checkVectorCapabilities();
  }, []);

  const loadCreatorData = async () => {
    try {
      setLoading(true);
      setDbError(null);

      console.log('📚 Loading creator titles from database...');

      if (user) {
        const creatorTitles = await titlesService.getTitlesByCreatorRights(user.id);
        setCreatorTitles(creatorTitles);
        setDbConnectivityStatus({ isConnected: true });
        console.log(`✅ Successfully loaded ${creatorTitles.length} creator titles from database`);
      }

    } catch (error) {
      console.error("❌ Database connectivity error loading creator titles:", error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      setDbConnectivityStatus({ isConnected: false, error: errorMessage });
      setDbError(errorMessage);

      toast({
        title: "Database Connection Error",
        description: "Unable to load titles. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (isCreatorView) {
      // Clear cache and reload creator data
      clearCache();
      loadCreatorData();
    } else {
      // Reset infinite scroll for buyers
      infiniteScroll.reset();
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const query = searchQuery.trim();
    setSearchTerm(query);
    setShowSuggestions(false);

    if (!query) {
      setSearchResults([]);
      if (isBuyerView) {
        // For buyers: just clear search results, infinite scroll will show all titles
        setSearchResults([]);
        setSearchType('traditional');
      }
      return;
    }

    // Prevent multiple concurrent searches
    if (searchLoading) {
      console.log('🔍 Search already in progress, skipping duplicate request');
      return;
    }

    // Generate unique search ID to handle race conditions
    const searchId = `search-${Date.now()}-${Math.random()}`;
    currentSearchId.current = searchId;

    setSearchLoading(true);

    try {
      if (isBuyerView) {
        // For buyers: Use enhanced search directly since infinite scroll has enhanced search disabled
        console.log('🔍 Starting enhanced search for buyers:', query);

        // Use enhanced search service directly for buyers when searching
        const searchResponse = await enhancedTitleSearchService.searchWithFilters(
          query,
          titles.length > 0 ? titles : [], // Use current titles or empty array
          {},
          {
            useVectorSearch: vectorSearchAvailable,
            userId: user?.id,
            hybridMode: true,
            maxResults: 50
          }
        );

        setSearchResults(searchResponse.results);
        setSearchType(searchResponse.searchType);
        console.log(`🎯 Enhanced search completed for buyers: ${searchResponse.results.length} results`);
      } else {
        // For creators: Use enhanced search on loaded titles
        const searchResponse = await enhancedTitleSearchService.searchWithFilters(
          query,
          titles,
          {},
          {
            useVectorSearch: vectorSearchAvailable,
            userId: user?.id,
            hybridMode: true,
            maxResults: 28
          }
        );

        // Only update results if this search is still the current one
        if (currentSearchId.current !== searchId) {
          console.log('🔍 Search result discarded - newer search in progress');
          return;
        }

        setSearchResults(searchResponse.results);
        setSearchType(searchResponse.searchType);

        console.log(`🎯 Search completed: ${searchResponse.results.length} results using ${searchResponse.searchType} search`);
      }

      // Track search analytics
      try {
        const resultCount = searchResults.length;
        await trackSearch(query, searchType, resultCount, user?.id);
      } catch (error) {
        console.warn('Failed to track search:', error);
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search Error",
        description: "Search failed. Please try again.",
        variant: "destructive"
      });

      // Fallback behavior
      if (currentSearchId.current === searchId) {
        setSearchResults([]);
        setSearchType('traditional');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
    setSearchResults([]);
    setSearchType('traditional');
    currentSearchId.current = null;

    // Clear search results for both buyers and creators
    setSearchResults([]);
    setSearchType('traditional');
  };

  const handleSearchInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Get search suggestions when query length is appropriate
    if (value.length >= 2 && vectorSearchAvailable) {
      try {
        const suggestions = await enhancedTitleSearchService.getSearchSuggestions(value);
        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.warn('Failed to get search suggestions:', error);
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    // Auto-submit search
    const form = document.querySelector('form');
    if (form) {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const prioritizeTitlesForBuyers = (titles: Title[]) => {
    return [...titles].sort((a, b) => {
      // 1. Database priority field (1 = high, 3 = low, default to 2 if not set)
      const aPriority = (a as any).priority || 2;
      const bPriority = (b as any).priority || 2;

      if (aPriority !== bPriority) {
        return aPriority - bPriority; // Lower number first (1 before 2 before 3)
      }

      // 2. Pitch availability (titles with pitch first)
      const aHasPitch = !!a.pitch;
      const bHasPitch = !!b.pitch;

      if (aHasPitch !== bHasPitch) {
        return bHasPitch ? 1 : -1; // Titles with pitch first
      }

      // 3. MANTA/RIDI rights (titles with MANTA/RIDI first)
      const aHasMantaRidi = (a.rights_owner?.includes('MANTA') || a.rights_owner?.includes('RIDI') ||
                             a.rights?.includes('MANTA') || a.rights?.includes('RIDI'));
      const bHasMantaRidi = (b.rights_owner?.includes('MANTA') || b.rights_owner?.includes('RIDI') ||
                             b.rights?.includes('MANTA') || b.rights?.includes('RIDI'));

      if (aHasMantaRidi !== bHasMantaRidi) {
        return bHasMantaRidi ? 1 : -1; // Titles with MANTA/RIDI first
      }

      // 4. Alphabetical by title_name_en (descending Z to A)
      const aTitle = (a.title_name_en || a.title_name_kr || '').toLowerCase();
      const bTitle = (b.title_name_en || b.title_name_kr || '').toLowerCase();
      return bTitle.localeCompare(aTitle);
    });
  };

  const sortTitles = (titles: Title[]) => {
    if (!sortField) return titles;

    return [...titles].sort((a, b) => {
      let aValue: string | string[] | null | undefined;
      let bValue: string | string[] | null | undefined;

      switch (sortField) {
        case 'title':
          aValue = a.title_name_en || a.title_name_kr || '';
          bValue = b.title_name_en || b.title_name_kr || '';
          break;
        case 'genre':
          aValue = Array.isArray(a.genre) ? a.genre.join(', ') : (a.genre || '');
          bValue = Array.isArray(b.genre) ? b.genre.join(', ') : (b.genre || '');
          break;
        case 'tone':
          aValue = a.tone || '';
          bValue = b.tone || '';
          break;
        case 'keywords':
          const aKeywords = (a as any).keywords || a.tags;
          const bKeywords = (b as any).keywords || b.tags;
          aValue = Array.isArray(aKeywords) ? aKeywords.join(', ') : (aKeywords || '');
          bValue = Array.isArray(bKeywords) ? bKeywords.join(', ') : (bKeywords || '');
          break;
        case 'comps':
          aValue = Array.isArray(a.comps) ? a.comps.join(', ') : (a.comps || '');
          bValue = Array.isArray(b.comps) ? b.comps.join(', ') : (b.comps || '');
          break;
        default:
          return 0;
      }

      // Convert to strings for comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aStr > bStr) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Get the full list of titles for creators (before pagination)
  const allCreatorTitles = (() => {
    if (!isCreatorView) return titles;

    if (searchResults.length > 0) {
      return searchResults.map(result => result.title);
    }

    let result = titles;

    // Apply search filter (fallback for non-enhanced search)
    if (searchTerm && searchResults.length === 0) {
      const { exactMatches, expandedMatches, phraseMatches } = enhancedSearch(
        result,
        searchTerm,
        getTitleSearchFields()
      );
      result = [...exactMatches, ...phraseMatches, ...expandedMatches];
    }

    // Apply sorting (but preserve search relevance order when there's a search term)
    return searchTerm ? result : sortTitles(result);
  })();

  const filteredTitles = (() => {
    if (isBuyerView) {
      // For buyers: Show search results when searching, otherwise show infinite scroll titles
      if (searchResults.length > 0) {
        return searchResults.map(result => result.title);
      }

      let result = titles;

      // Only check for duplicates during search, not during normal browsing
      if (searchTerm) {
        const uniqueIds = new Set();
        const duplicates = [];
        result.forEach(title => {
          if (uniqueIds.has(title.title_id)) {
            duplicates.push(title.title_id);
          } else {
            uniqueIds.add(title.title_id);
          }
        });

        if (duplicates.length > 0) {
          console.warn('🔍 TITLELIST: Found duplicate titles during search!', duplicates);
          // Remove duplicates by keeping only the first occurrence
          const seen = new Set();
          result = result.filter(title => {
            if (seen.has(title.title_id)) {
              return false;
            }
            seen.add(title.title_id);
            return true;
          });
          console.log('🔍 TITLELIST: Removed duplicates, now have:', result.length, 'unique titles');
        }

        // Apply sorting only during search
        return sortTitles(result);
      }

      // Apply priority sorting only on initial load, preserve order during infinite scroll
      if (infiniteScroll.titles.length <= 12) { // Initial load only
        return prioritizeTitlesForBuyers(sortTitles(result));
      } else {
        return result; // Preserve infinite scroll order
      }
    } else {
      // For creators: Apply pagination to the full list
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return allCreatorTitles.slice(startIndex, endIndex);
    }
  })();

  const formatGenre = (genre: string | string[]) => {
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatContentFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Genre filters removed - keeping only pitch deck filter

  // Genre filter handler removed since genre filters are no longer used

  const SortableHeader = ({ field, children, className = "" }: { 
    field: string; 
    children: React.ReactNode; 
    className?: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 hover:text-gray-900 transition-colors ${className}`}
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )
      ) : (
        <ArrowUpDown className="w-4 h-4 text-gray-400 opacity-60" />
      )}
    </button>
  );

  return (
    <PageContainer>
        {/* Header */}
        <div>
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-midnight-ink leading-tight">Title Library</h2>
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="text-midnight-ink border-midnight-ink/20 hover:bg-midnight-ink/5 p-1.5 sm:p-2"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {/* View Mode Toggle - Same line as TITLES, far right */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('card')}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all ${
                    viewMode === 'card'
                      ? 'bg-white text-hanok-teal shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline ml-1">Card</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-hanok-teal shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List View"
                >
                  <ListIcon className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline ml-1">List</span>
                </button>
              </div>
            </div>
            {isCreatorView && (
              <p className="text-sm sm:text-base lg:text-xl text-midnight-ink-600 leading-relaxed">
                Manage your Korean content titles.
              </p>
            )}
          </div>


        {/* All Titles Table */}
        <div>
          {/* Desktop Add Button */}
          {isCreatorView && (
            <div className="hidden sm:flex justify-end mb-6 sm:mb-8">
              <Link to="/creators/titles/add">
                <Button className="border-gray-300 hover:bg-gray-100 px-6 py-3 text-base rounded-lg font-medium transition-colors">
                  + Add a new title
                </Button>
              </Link>
            </div>
          )}
          
          {/* Mobile Add Button - if creator view */}
          {isCreatorView && (
            <div className="sm:hidden mb-4">
              <Link to="/creators/titles/add">
                <Button className="border-gray-300 hover:bg-gray-100 px-4 py-2 text-sm rounded-lg font-medium w-full transition-colors">
                  + Add a new title
                </Button>
              </Link>
            </div>
          )}
          
          {/* Search Bar */}
          <div className="relative mb-6 sm:mb-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                searchLoading ? 'text-hanok-teal animate-pulse' : 'text-midnight-ink-400'
              }`} />
              <input
                type="text"
                placeholder={vectorSearchAvailable ? "Search titles with AI-powered semantic search..." : "Search titles..."}
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Delay to allow clicking suggestions
                disabled={searchLoading}
                className="w-full pl-10 sm:pl-12 pr-24 sm:pr-32 py-3 sm:py-4 text-sm sm:text-base lg:text-lg bg-porcelain-blue-50 border border-gray-300 rounded-2xl outline-none focus:ring-2 focus:ring-hanok-teal focus:border-hanok-teal text-midnight-ink disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                {searchTerm && (
                  <Button
                    type="button"
                    onClick={handleClearSearch}
                    variant="ghost"
                    size="sm"
                    className="text-midnight-ink-400 hover:text-midnight-ink-600"
                    disabled={searchLoading}
                  >
                    Clear
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={searchLoading}
                  className="border-gray-300 hover:bg-gray-100 px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Search icon */}
                  {searchLoading ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Search className="h-3 w-3 mr-1" />
                  )}

                  {/* Text - Hide on mobile */}
                  <span className="hidden sm:inline">
                    {searchLoading ? 'Searching...' : 'Search'}
                  </span>
                </Button>
              </div>
            </form>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-medium text-midnight-ink-500 mb-2 px-2">Suggestions:</div>
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm text-midnight-ink-700 hover:bg-hanok-teal/5 hover:text-hanok-teal rounded-lg transition-colors"
                    >
                      <Search className="inline w-3 h-3 mr-2 opacity-50" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Status Indicator */}
            {searchTerm && (
              <div className="flex items-center justify-between mt-2 px-2">
                <div className="flex items-center gap-2 text-xs text-midnight-ink-500">
                  {searchTerm && searchResults.length > 0 && (
                    <span className="text-midnight-ink-600">
                      {searchResults.length} results • {searchType === 'vector' ? 'Semantic' : searchType === 'hybrid' ? 'AI + Text' : 'Text'} search
                    </span>
                  )}
                </div>
                {searchTerm && !searchLoading && (
                  <span className="text-xs text-midnight-ink-400">
                    Search completed in {searchType === 'vector' || searchType === 'hybrid' ? 'AI-powered mode' : 'traditional mode'}
                  </span>
                )}
              </div>
            )}
            
          </div>
          
          
          {/* Render based on view mode */}
          {viewMode === 'card' ? (
            // Card View
            <div>
              {(loading || (isBuyerView && infiniteScroll.loading)) ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-hanok-teal" />
                  <span className="ml-2 text-midnight-ink-600">Loading titles...</span>
                </div>
              ) : filteredTitles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {filteredTitles.map((title) => (
                      <Card key={title.title_id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                        <Link to={`/buyers/titles/${title.title_id}`}>
                          <CardContent className="p-0">
                            <div className="relative h-48 bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal/10 overflow-hidden">
                              {title.title_image ? (
                                <img
                                  src={title.title_image}
                                  alt={title.title_name_en || title.title_name_kr}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-midnight-ink-400">
                                  <div className="text-center">
                                    <div className="text-2xl mb-2">📚</div>
                                    <div className="text-xs">No Image</div>
                                  </div>
                                </div>
                              )}
                              {title.pitch && title.pitch.trim() && (
                                <div className="absolute top-3 right-3">
                                  <span className="text-xs font-medium px-2 py-1 rounded-full shadow-lg text-white" style={{backgroundColor: '#FF6B6B'}}>
                                    Pitch Available
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="p-4">
                              <h3 className="font-semibold text-lg text-midnight-ink mb-2 line-clamp-2 group-hover:text-hanok-teal transition-colors">
                                {title.title_name_en || title.title_name_kr}
                              </h3>
                              
                              {title.title_name_en && title.title_name_kr && (
                                <p className="text-sm text-midnight-ink-600 mb-2 line-clamp-1">
                                  {title.title_name_kr}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-1 mb-3">
                                {title.genre && (
                                  Array.isArray(title.genre) ? (
                                    title.genre.map((g, idx) => (
                                      <span key={`${title.title_id}-genre-${idx}`} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                        {formatGenre(g)}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                      {formatGenre(title.genre)}
                                    </span>
                                  )
                                )}
                                {title.content_format && (
                                  <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                    {formatContentFormat(title.content_format)}
                                  </span>
                                )}
                                {title.tone && (
                                  <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs">
                                    {title.tone}
                                  </span>
                                )}
                              </div>
                              
                              {title.synopsis && (
                                <p className="text-sm text-midnight-ink-600 line-clamp-3 leading-relaxed">
                                  {title.synopsis}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Link>
                      </Card>
                    ))}
                  </div>

                  {/* Infinite scroll loading indicator for buyers */}
                  {isBuyerView && infiniteScroll.loadingMore && (
                    <div className="flex justify-center items-center py-8">
                      <RefreshCw className="w-5 h-5 animate-spin text-hanok-teal mr-2" />
                      <span className="text-midnight-ink-600">Loading more titles...</span>
                    </div>
                  )}

                  {/* Infinite scroll end indicator for buyers */}
                  {isBuyerView && !infiniteScroll.hasMore && filteredTitles.length > 0 && (
                    <div className="text-center py-8">
                      <p className="text-midnight-ink-500">You've reached the end! {filteredTitles.length} titles total.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-midnight-ink mb-2">No titles found</h3>
                  <p className="text-midnight-ink-600">
                    {isBuyerView && infiniteScroll.error ? (
                      <>Database error: {infiniteScroll.error}</>
                    ) : (
                      <>No titles found matching your search.</>
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : (
            // List View
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Desktop Table Header */}
              <div className="hidden lg:block bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b">
                <div className="grid grid-cols-11 gap-4 items-center font-semibold text-gray-700 text-xs sm:text-sm">
                  <div className="col-span-1">Image</div>
                  <div className="col-span-3">
                    <SortableHeader field="title">Title</SortableHeader>
                  </div>
                  <div className="col-span-2">
                    <SortableHeader field="genre">Genre</SortableHeader>
                  </div>
                  <div className="col-span-2">
                    <SortableHeader field="tone">Tone</SortableHeader>
                  </div>
                  <div className="col-span-2">
                    <SortableHeader field="keywords">Keywords</SortableHeader>
                  </div>
                  <div className="col-span-1">
                    <SortableHeader field="comps">Comps</SortableHeader>
                  </div>
                </div>
              </div>
              
              {/* Mobile Header */}
              <div className="lg:hidden bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 border-b">
                <div className="text-xs sm:text-sm font-semibold text-gray-700">
                  All Titles ({filteredTitles.length})
                </div>
              </div>
            
            <div className="divide-y">
              {(loading || (isBuyerView && infiniteScroll.loading)) ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  Loading titles...
                </div>
              ) : filteredTitles.length > 0 ? (
                <>
                  {filteredTitles.map((title) => (
                    <Link key={title.title_id} to={`/buyers/titles/${title.title_id}`} className="block">
                      {/* Desktop Table Row */}
                      <div className="hidden lg:grid px-4 sm:px-6 py-4 grid-cols-11 gap-4 items-center hover:bg-gray-50 cursor-pointer transition-colors">
                        {/* Desktop content - keeping existing structure */}
                        <div className="col-span-1">
                          {title.title_image ? (
                            <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gray-200 rounded-lg overflow-hidden">
                              <img 
                                src={title.title_image} 
                                alt={title.title_name_en || title.title_name_kr}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                                  e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-gray-400">No Image</span>';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-gray-400">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="col-span-3">
                          {title.pitch && (
                            <div className="mb-1">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{backgroundColor: '#FF6B6B'}}>
                                Pitch
                              </span>
                            </div>
                          )}
                          <div className="font-medium text-gray-800 line-clamp-1 text-sm">
                            {title.title_name_en || title.title_name_kr}
                          </div>
                          {title.title_name_en && title.title_name_kr && (
                            <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                              {title.title_name_kr}
                            </div>
                          )}
                        </div>
                        
                        <div className="col-span-2">
                          {title.genre && (Array.isArray(title.genre) ? title.genre.length > 0 : true) ? (
                            <div className="flex flex-wrap gap-1 max-h-[3.5rem] overflow-hidden">
                              {Array.isArray(title.genre) ? (
                                title.genre.map((g, idx) => (
                                  <div key={`${title.title_id}-genre-${idx}`} className="inline-block bg-cyan-100 text-cyan-800 px-2 py-1 rounded-lg text-xs font-medium truncate max-w-[120px]" title={formatGenre(g)}>
                                    {formatGenre(g)}
                                  </div>
                                ))
                              ) : (
                                <div className="inline-block bg-cyan-100 text-cyan-800 px-2 py-1 rounded-lg text-xs font-medium truncate max-w-[120px]" title={formatGenre(title.genre)}>
                                  {formatGenre(title.genre)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        
                        <div className="col-span-2">
                          {title.tone ? (
                            <div className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-lg text-xs font-medium">
                              {title.tone}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        
                        <div className="col-span-2">
                          {((title as any).keywords || title.tags) && ((title as any).keywords || title.tags).length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-h-[3.5rem] overflow-hidden">
                              {((title as any).keywords || title.tags).map((tag: string, idx: number) => (
                                <div key={`${title.title_id}-keyword-${idx}`} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium truncate max-w-[120px]" title={tag}>
                                  {tag}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        
                        <div className="col-span-1">
                          <OptimizedTierGatedContent requiredTier="basic">
                            {title.comps && title.comps.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {title.comps.map((comp, index) => (
                                  <div key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium truncate max-w-[150px]" title={comp}>
                                    {comp}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </OptimizedTierGatedContent>
                        </div>
                      </div>

                      {/* Mobile Card Layout */}
                      <div className="lg:hidden p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex gap-3 sm:gap-4">
                          {/* Image */}
                          <div className="flex-shrink-0">
                            {title.title_image ? (
                              <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gray-200 rounded-lg overflow-hidden">
                                <img 
                                  src={title.title_image} 
                                  alt={title.title_name_en || title.title_name_kr}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-400">No Image</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              {title.pitch && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-lg mr-2 text-white" style={{backgroundColor: '#FF6B6B'}}>
                                  Pitch
                                </span>
                              )}
                              <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-2">
                                {title.title_name_en || title.title_name_kr}
                              </h3>
                              {title.title_name_en && title.title_name_kr && (
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">
                                  {title.title_name_kr}
                                </p>
                              )}
                            </div>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 items-center">
                              {title.genre && (
                                Array.isArray(title.genre) ? (
                                  title.genre.slice(0, 2).map((g, idx) => (
                                    <span key={idx} className="inline-block bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded-lg text-xs font-medium">
                                      {formatGenre(g)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="inline-block bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded-lg text-xs font-medium">
                                    {formatGenre(title.genre)}
                                  </span>
                                )
                              )}
                              {Array.isArray(title.genre) && title.genre.length > 2 && (
                                <span className="text-xs text-gray-500">+{title.genre.length - 2}</span>
                              )}
                              
                              {title.tone && (
                                <span className="inline-block bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-lg text-xs font-medium">
                                  {title.tone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {/* Infinite scroll loading indicator for buyers */}
                  {isBuyerView && infiniteScroll.loadingMore && (
                    <div className="px-6 py-8 text-center">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="w-5 h-5 animate-spin text-hanok-teal mr-2" />
                        <span className="text-midnight-ink-600">Loading more titles...</span>
                      </div>
                    </div>
                  )}

                  {/* Infinite scroll end indicator for buyers */}
                  {isBuyerView && !infiniteScroll.hasMore && filteredTitles.length > 0 && (
                    <div className="px-6 py-8 text-center">
                      <p className="text-midnight-ink-500">You've reached the end! {filteredTitles.length} titles total.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="px-6 py-12 text-center text-gray-500">
                  {isBuyerView && infiniteScroll.error ? (
                    <>Database error: {infiniteScroll.error}</>
                  ) : (
                    <>No titles found matching your search.</>
                  )}
                </div>
              )}
            </div>

            {/* Pagination for list view - only for creators */}
            {isCreatorView && allCreatorTitles.length > itemsPerPage && (
              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, allCreatorTitles.length)} to {Math.min(currentPage * itemsPerPage, allCreatorTitles.length)} of {allCreatorTitles.length} titles
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="text-midnight-ink-600 border-porcelain-blue-300 hover:bg-porcelain-blue-100"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, Math.ceil(allCreatorTitles.length / itemsPerPage)) }, (_, i) => {
                        const totalPages = Math.ceil(allCreatorTitles.length / itemsPerPage);
                        let pageNumber;
                        
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                            className={currentPage === pageNumber 
                              ? "bg-hanok-teal text-white hover:bg-hanok-teal/90" 
                              : "text-midnight-ink-600 border-porcelain-blue-300 hover:bg-porcelain-blue-100"
                            }
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(allCreatorTitles.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(allCreatorTitles.length / itemsPerPage)}
                      className="text-midnight-ink-600 border-porcelain-blue-300 hover:bg-porcelain-blue-100"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

export default function TitleList() {
  return (
    <TierProvider>
      <TitleListContent />
    </TierProvider>
  );
}
