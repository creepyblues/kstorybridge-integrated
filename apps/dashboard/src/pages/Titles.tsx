import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { Search, RefreshCw, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { Button, Card, CardContent, useToast } from "@kstorybridge/ui";
import { titlesService, type Title } from "@/services/titlesService";
import FeaturedTitlesCarousel from "@/components/FeaturedTitlesCarousel";

import { useAuth } from "@/hooks/useAuth";
import PremiumColumn from "@/components/PremiumColumn";
import OptimizedTierGatedContent from "@/components/OptimizedTierGatedContent";
import { TierProvider } from "@/contexts/TierContext";
import { enhancedSearch, getTitleSearchFields } from "@/utils/searchUtils";
import { enhancedTitleSearchService, type SearchResult } from "@/services/enhancedTitleSearchService";
import { useDataCache } from "@/contexts/DataCacheContext";
import { trackSearch } from "@/utils/analytics";

function TitlesContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const { 
    getTitles, 
    getCreatorTitles, 
    setTitles, 
    setCreatorTitles, 
    isFresh, 
    refreshData,
    clearCache 
  } = useDataCache();
  
  const [searchQuery, setSearchQuery] = useState(""); // What user types
  const [searchTerm, setSearchTerm] = useState(""); // What's actually searched/filtered
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [sortField, setSortField] = useState<string | null>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showOnlyWithPitch, setShowOnlyWithPitch] = useState(false);
  const [activeGenreFilter, setActiveGenreFilter] = useState<string | null>(null);
  
  // Enhanced search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchType, setSearchType] = useState<'vector' | 'traditional' | 'hybrid'>('traditional');
  const [vectorSearchAvailable, setVectorSearchAvailable] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Determine if this is creator view based on route
  const isCreatorView = location.pathname.startsWith('/creators');
  const isBuyerView = location.pathname.startsWith('/buyers');

  // Get data from cache
  const titles = isCreatorView ? getCreatorTitles() : getTitles();

  useEffect(() => {
    // Only load data if cache is empty or stale
    const dataKey = isCreatorView ? 'creatorTitles' : 'titles';
    const shouldLoadTitles = titles.length === 0 || !isFresh(dataKey);
    
    if (shouldLoadTitles) {
      loadData();
    }
  }, [isCreatorView, user, titles.length]); // Remove isFresh from dependencies

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

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      
      if (isCreatorView && user) {
        // Load creator's own titles using rights field
        const creatorTitles = await titlesService.getTitlesByCreatorRights(user.id);
        setCreatorTitles(creatorTitles);
      } else {
        // Load all titles for buyers
        const allTitles = await titlesService.getAllTitles();
        setTitles(allTitles);
        
        // Featured titles are now loaded by the FeaturedTitlesCarousel component
      }
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    // Clear all cache data including titles, title details, favorites, etc.
    clearCache();
    // Featured titles refresh is handled by the FeaturedTitlesCarousel component
    loadData(true);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const query = searchQuery.trim();
    setSearchTerm(query);
    setShowSuggestions(false);
    
    if (!query) {
      setSearchResults([]);
      setCurrentPage(1);
      return;
    }

    setSearchLoading(true);
    
    try {
      // Use enhanced search service with vector search capabilities
      const searchResponse = await enhancedTitleSearchService.searchWithFilters(
        query,
        titles,
        {
          showOnlyWithPitch,
          activeGenreFilter
        },
        {
          useVectorSearch: vectorSearchAvailable,
          userId: user?.id,
          hybridMode: true,
          maxResults: 100 // Get more results for better ranking
        }
      );

      setSearchResults(searchResponse.results);
      setSearchType(searchResponse.searchType);

      console.log(`🎯 Search completed: ${searchResponse.results.length} results using ${searchResponse.searchType} search`);
      
      // Track search analytics
      try {
        await trackSearch(query, searchResponse.searchType, searchResponse.results.length, user?.id);
      } catch (error) {
        console.warn('Failed to track search:', error);
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search Error",
        description: "Search failed. Using traditional search instead.",
        variant: "destructive"
      });
      
      // Fallback to traditional search
      setSearchResults([]);
      setSearchType('traditional');
    } finally {
      setSearchLoading(false);
      setCurrentPage(1);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
    setSearchResults([]);
    setSearchType('traditional');
    setCurrentPage(1);
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

  const filteredTitles = (() => {
    // If we have search results from enhanced search, use those
    if (searchTerm && searchResults.length > 0) {
      return searchResults.map(result => result.title);
    }
    
    // Otherwise use traditional filtering
    let result = titles;
    
    // Apply pitch filter first
    if (showOnlyWithPitch) {
      result = result.filter(title => title.pitch && title.pitch.trim() !== '');
    }
    
    // Apply genre filter - use the same search logic as regular search
    if (activeGenreFilter) {
      const { exactMatches, expandedMatches, phraseMatches } = enhancedSearch(
        result,
        activeGenreFilter,
        getTitleSearchFields()
      );
      
      // Combine all matches
      result = [...exactMatches, ...phraseMatches, ...expandedMatches];
    }
    
    // Apply search filter (fallback for non-enhanced search)
    if (searchTerm && searchResults.length === 0) {
      const { exactMatches, expandedMatches, phraseMatches } = enhancedSearch(
        result,
        searchTerm,
        getTitleSearchFields()
      );
      // Combine results with proper ordering: exact matches first, then phrase matches, then expanded matches
      result = [...exactMatches, ...phraseMatches, ...expandedMatches];
    }
    
    // Apply sorting (but preserve search relevance order when there's a search term)
    return searchTerm ? result : sortTitles(result);
  })();

  // Reset pagination when search term, sorting, or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection, showOnlyWithPitch, activeGenreFilter]);

  const formatGenre = (genre: string | string[]) => {
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatContentFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const genreFilters = [
    "Romantasy", "Contemporary Romance", "rom-com", "romantic thriller", "LGBTQ+ Romance",
    "spy thriller", "crime thriller", "comedy", "slice of life", "character drama",
    "true story", "action", "high fantasy", "supernatural drama", "horror",
    "grounded sci-fi", "sci-fi"
  ];

  const handleGenreFilter = (genre: string) => {
    // Toggle: if same genre is clicked, clear it; otherwise set the new genre
    if (activeGenreFilter === genre) {
      setActiveGenreFilter(null);
    } else {
      setActiveGenreFilter(genre);
    }
  };

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
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink leading-tight mb-2 sm:mb-4">TITLES</h1>
              <p className="text-sm sm:text-base lg:text-xl text-midnight-ink-600 leading-relaxed">
                {isCreatorView ? "Manage your Korean content titles." : "Discover and browse Korean content titles."}
              </p>
            </div>
            <div className="text-midnight-ink-600 text-sm sm:text-base lg:text-lg font-medium text-right sm:text-left">
              {filteredTitles.length} titles
            </div>
          </div>

        {/* Featured Titles Section - Only show for buyers */}
        {!isCreatorView && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Featured Titles</h2>
            
            <FeaturedTitlesCarousel className="" />
          </div>
        )}

        {/* Divider - Only show for buyers */}
        {!isCreatorView && <div className="border-t border-gray-200 my-8 sm:my-12"></div>}

        {/* All Titles Table */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-midnight-ink">
              {isCreatorView ? "MY TITLES" : "ALL TITLES"}
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2 text-midnight-ink border-midnight-ink/20 hover:bg-midnight-ink/5"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {isCreatorView && (
                <Link to="/creators/titles/add">
                  <Button className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg font-medium">
                    + Add a new title
                  </Button>
                </Link>
              )}
            </div>
          </div>
          
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
                className="w-full pl-10 sm:pl-12 pr-24 sm:pr-32 py-3 sm:py-4 text-sm sm:text-base lg:text-lg bg-porcelain-blue-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-hanok-teal text-midnight-ink disabled:opacity-50 disabled:cursor-not-allowed"
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
                  size="sm"
                  disabled={searchLoading}
                  className="bg-gradient-to-r from-hanok-teal via-hanok-teal to-blue-600 hover:from-hanok-teal/90 hover:via-hanok-teal/90 hover:to-blue-700 text-white shadow-lg hover:shadow-xl border-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 transform hover:scale-105 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                  
                  {/* Search icon */}
                  {searchLoading ? (
                    <RefreshCw className="h-3 w-3 mr-1 pointer-events-none animate-spin" />
                  ) : (
                    <Search className="h-3 w-3 mr-1 pointer-events-none" />
                  )}
                  
                  {/* Text */}
                  <span className="relative z-10 pointer-events-none">
                    {searchLoading ? 'Searching...' : 'Search'}
                  </span>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-hanok-teal/50 blur-md group-hover:bg-hanok-teal/60 transition-colors duration-300 pointer-events-none"></div>
                </Button>
              </div>
            </form>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
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
            {(searchTerm || vectorSearchAvailable) && (
              <div className="flex items-center justify-between mt-2 px-2">
                <div className="flex items-center gap-2 text-xs text-midnight-ink-500">
                  {vectorSearchAvailable && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-hanok-teal/10 text-hanok-teal rounded-full">
                      <div className="w-2 h-2 bg-hanok-teal rounded-full animate-pulse"></div>
                      AI Search Active
                    </span>
                  )}
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
          
          {/* Filters Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-start gap-3 flex-wrap">
              <span className="text-sm font-bold text-hanok-teal mt-1">POPULAR FILTERS:</span>
              <div className="flex flex-wrap gap-2">
                {/* Pitch deck filter */}
                <button 
                  onClick={() => setShowOnlyWithPitch(!showOnlyWithPitch)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-200 ${
                    showOnlyWithPitch 
                      ? 'bg-hanok-teal text-white border-hanok-teal' 
                      : 'bg-hanok-teal/10 text-hanok-teal border-hanok-teal/20 hover:bg-hanok-teal hover:text-white'
                  }`}
                >
                  titles with pitch deck
                </button>
                
                {/* Genre filters */}
                {genreFilters.map((genre) => (
                  <button 
                    key={genre}
                    onClick={() => handleGenreFilter(genre)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-200 ${
                      activeGenreFilter === genre
                        ? 'bg-purple-600 text-white border-purple-600' 
                        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-600 hover:text-white hover:border-purple-600'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Active filters summary */}
            {(showOnlyWithPitch || activeGenreFilter) && (
              <div className="mt-3 text-xs text-midnight-ink-500">
                Active filters: {showOnlyWithPitch && "Pitch deck"}{showOnlyWithPitch && activeGenreFilter && ", "}{activeGenreFilter}
                <button 
                  onClick={() => {
                    setShowOnlyWithPitch(false);
                    setActiveGenreFilter(null);
                  }}
                  className="ml-2 text-hanok-teal hover:text-hanok-teal-600 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          
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
              {loading ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  Loading titles...
                </div>
              ) : filteredTitles.length > 0 ? (
                (() => {
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const currentTitles = filteredTitles.slice(startIndex, endIndex);
                  
                  return currentTitles.map((title) => (
                    <Link key={title.title_id} to={`/titles/${title.title_id}`} className="block">
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
                              <span className="bg-hanok-teal text-white text-xs font-medium px-2 py-0.5 rounded-full">
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
                                <span className="bg-hanok-teal text-white text-xs font-medium px-2 py-0.5 rounded-lg mr-2">
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
                  ));
                })()
              ) : (
                <div className="px-6 py-12 text-center text-gray-500">
                  No titles found matching your search.
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {filteredTitles.length > itemsPerPage && (
              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTitles.length)} to {Math.min(currentPage * itemsPerPage, filteredTitles.length)} of {filteredTitles.length} titles
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
                      {Array.from({ length: Math.min(5, Math.ceil(filteredTitles.length / itemsPerPage)) }, (_, i) => {
                        const totalPages = Math.ceil(filteredTitles.length / itemsPerPage);
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
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredTitles.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(filteredTitles.length / itemsPerPage)}
                      className="text-midnight-ink-600 border-porcelain-blue-300 hover:bg-porcelain-blue-100"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Titles() {
  return (
    <TierProvider>
      <TitlesContent />
    </TierProvider>
  );
}
