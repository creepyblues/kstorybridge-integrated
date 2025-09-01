import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Search, RefreshCw, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { Button, Card, CardContent, useToast } from "@kstorybridge/ui";
import { titlesService, type Title } from "@/services/titlesService";

import { useAuth } from "@/hooks/useAuth";
import PremiumColumn from "@/components/PremiumColumn";
import OptimizedTierGatedContent from "@/components/OptimizedTierGatedContent";
import { TierProvider } from "@/contexts/TierContext";
import { enhancedSearch, getTitleSearchFields } from "@/utils/searchUtils";
import { enhancedTitleSearchService, type SearchResult } from "@/services/enhancedTitleSearchService";
import { trackSearch } from "@/utils/analytics";

function SearchResultsContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
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

  const [titles, setTitles] = useState<Title[]>([]);

  // Parse URL search parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
      setSearchTerm(urlSearch);
    }
  }, [location.search]);

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

  // Auto-search when searchTerm is set from URL
  useEffect(() => {
    if (searchTerm) {
      handleSearch(searchTerm);
    } else {
      loadAllTitles();
    }
  }, [searchTerm]);

  const loadAllTitles = async () => {
    try {
      setLoading(true);
      const allTitles = await titlesService.getAllTitles();
      setTitles(allTitles);
      setSearchResults([]);
    } catch (error) {
      console.error("Error loading titles:", error);
      toast({ title: "Error loading titles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      setSearchLoading(true);
      
      // Use enhanced search service with vector search capabilities
      const searchResponse = await enhancedTitleSearchService.searchWithFilters(
        query,
        {
          contentFormat: null,
          genre: activeGenreFilter,
          tone: null,
          audience: null,
          hasAttachment: showOnlyWithPitch,
          minViews: null,
          maxViews: null,
          minRating: null,
          maxRating: null,
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
        description: "Search failed. Please try again.",
        variant: "destructive"
      });
      
      // Fallback to showing all titles
      setSearchResults([]);
      setSearchType('traditional');
    } finally {
      setSearchLoading(false);
      setCurrentPage(1);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    setSearchTerm(query);
    setShowSuggestions(false);
    
    // Update URL with search parameter
    const params = new URLSearchParams();
    if (query) {
      params.set('search', query);
    }
    navigate(`/search-results?${params.toString()}`, { replace: true });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
    setSearchResults([]);
    setSearchType('traditional');
    setCurrentPage(1);
    navigate('/search-results', { replace: true });
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
        default:
          aValue = '';
          bValue = '';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      return 0;
    });
  };

  // Get display titles (from search results or all titles)
  const displayTitles = (() => {
    const baseResults = searchTerm && searchResults.length > 0 
      ? searchResults.map(result => result.title)
      : titles;
    
    // Apply filters
    let filtered = baseResults.filter(title => {
      // Filter by pitch availability
      if (showOnlyWithPitch && (!title.pitch || !title.pitch.trim())) {
        return false;
      }
      
      // Filter by genre
      if (activeGenreFilter) {
        const titleGenres = Array.isArray(title.genre) ? title.genre : [title.genre].filter(Boolean);
        return titleGenres.some(g => g?.toLowerCase() === activeGenreFilter.toLowerCase());
      }
      
      return true;
    });
    
    // Apply sorting (but preserve search relevance order when there's a search term)
    return searchTerm ? filtered : sortTitles(filtered);
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

  // Pagination
  const totalPages = Math.ceil(displayTitles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTitles = displayTitles.slice(startIndex, startIndex + itemsPerPage);

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-3 h-3 text-hanok-teal" /> : 
      <ChevronDown className="w-3 h-3 text-hanok-teal" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-midnight-ink/5 via-porcelain-blue-100/30 to-midnight-ink/10 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink tracking-tight">
              SEARCH RESULTS
            </h2>
            {searchTerm && (
              <span className="text-sm text-midnight-ink-600 bg-porcelain-blue-100 px-3 py-1 rounded-full">
                "{searchTerm}"
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Link to="/titles">
              <Button
                variant="outline"
                className="flex items-center gap-2 text-midnight-ink border-midnight-ink/20 hover:bg-midnight-ink/5"
              >
                ← Back to All Titles
              </Button>
            </Link>
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
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
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
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                
                {searchLoading ? (
                  <RefreshCw className="h-3 w-3 mr-1 pointer-events-none animate-spin" />
                ) : (
                  <Search className="h-3 w-3 mr-1 pointer-events-none" />
                )}
                
                <span className="relative z-10 pointer-events-none">
                  {searchLoading ? 'Searching...' : 'Search'}
                </span>
                
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
                  <span className="bg-hanok-teal/10 text-hanok-teal px-2 py-1 rounded-full">
                    AI Search Enabled
                  </span>
                )}
                {searchTerm && (
                  <span>
                    {displayTitles.length} results • {searchType} search
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Genre Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveGenreFilter(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                activeGenreFilter === null
                  ? 'bg-hanok-teal text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Genres
            </button>
            {genreFilters.slice(0, 6).map(genre => (
              <button
                key={genre}
                onClick={() => setActiveGenreFilter(activeGenreFilter === genre ? null : genre)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  activeGenreFilter === genre
                    ? 'bg-hanok-teal text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
          
          {/* Sorting Controls */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-midnight-ink-600">Sort by:</span>
            <div className="flex gap-1">
              {[
                { key: 'title', label: 'Title' },
                { key: 'genre', label: 'Genre' },
                { key: 'tone', label: 'Tone' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`group flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                    sortField === key
                      ? 'bg-hanok-teal text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                  {getSortIcon(key)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-midnight-ink-600">
            {searchTerm ? (
              `Found ${displayTitles.length} result${displayTitles.length === 1 ? '' : 's'} for "${searchTerm}"`
            ) : (
              `Showing all ${displayTitles.length} title${displayTitles.length === 1 ? '' : 's'}`
            )}
          </p>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-hanok-teal" />
            <span className="ml-2 text-midnight-ink-600">Loading...</span>
          </div>
        ) : currentTitles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentTitles.map((title) => (
              <Card key={title.title_id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <Link to={`/titles/${title.title_id}`}>
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
                          <span className="bg-hanok-teal text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg">
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
                          <span className="inline-block bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs">
                            {formatGenre(title.genre)}
                          </span>
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
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-midnight-ink mb-2">
              {searchTerm ? 'No results found' : 'No titles available'}
            </h3>
            <p className="text-midnight-ink-600 mb-4">
              {searchTerm ? 
                `Try adjusting your search terms or filters` :
                'Check back later for new content'
              }
            </p>
            {searchTerm && (
              <Button
                onClick={handleClearSearch}
                variant="outline"
                className="text-midnight-ink border-midnight-ink/20 hover:bg-midnight-ink/5"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
              return (
                <Button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  className={currentPage === pageNum ? "bg-hanok-teal text-white" : ""}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchResults() {
  return (
    <TierProvider>
      <SearchResultsContent />
    </TierProvider>
  );
}