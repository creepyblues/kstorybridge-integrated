import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { Search, RefreshCw, ChevronUp, ChevronDown, ArrowUpDown, Plus } from "lucide-react";
import { Button, Card, CardContent, useToast } from "@kstorybridge/ui";
import { titlesService, type Title } from "@/services/titlesService";

import { useAuth } from "@/hooks/useAuth";
import { enhancedSearch, getTitleSearchFields } from "@/utils/searchUtils";
import { enhancedTitleSearchService, type SearchResult } from "@/services/enhancedTitleSearchService";
import { useDataCache } from "@/contexts/DataCacheContext";
import { trackSearch } from "@/utils/analytics";

export default function CreatorHome() {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const {
    getCreatorTitles,
    setCreatorTitles,
    isFresh,
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

  // Get data from cache
  const titles = getCreatorTitles();

  useEffect(() => {
    // Only load data if cache is empty or stale
    const shouldLoadTitles = titles.length === 0 || !isFresh('creatorTitles');

    if (shouldLoadTitles) {
      loadData();
    }
  }, [user, titles.length]);

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

      if (user) {
        // Load creator's own titles using rights field
        const creatorTitles = await titlesService.getTitlesByCreatorRights(user.id);
        setCreatorTitles(creatorTitles);
      }

    } catch (error) {
      console.error("Error loading creator data:", error);
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    // Clear all cache data including titles, title details, favorites, etc.
    clearCache();
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

      console.log(`🎯 Creator search completed: ${searchResponse.results.length} results using ${searchResponse.searchType} search`);

      // Track search analytics
      try {
        await trackSearch(query, searchResponse.searchType, searchResponse.results.length, user?.id);
      } catch (error) {
        console.warn('Failed to track search:', error);
      }
    } catch (error) {
      console.error('Creator search failed:', error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-midnight-ink leading-tight mb-2 sm:mb-4">HOME</h2>
            <p className="text-sm sm:text-base lg:text-xl text-midnight-ink-600 leading-relaxed">
              Welcome to your creator dashboard. Manage your Korean content titles.
            </p>
          </div>
        </div>

        {/* Creator Quick Actions */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Link to="/creators/titles">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Search className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Manage Titles</h3>
                      <p className="text-sm text-gray-600">View and edit your titles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/creators/requests">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <RefreshCw className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">View Requests</h3>
                      <p className="text-sm text-gray-600">Track interest in your content</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Titles */}
        {filteredTitles.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Your Recent Titles</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTitles.slice(0, 6).map((title) => (
                <Link
                  key={title.title_id}
                  to={`/creators/titles/${title.title_id}`}
                  className="block"
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      {title.title_image && (
                        <div className="aspect-video mb-3 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={title.title_image}
                            alt={title.title_name_en || title.title_name_kr || 'Title'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                        {title.title_name_en || title.title_name_kr || 'Untitled'}
                      </h3>
                      {title.genre && Array.isArray(title.genre) && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {title.genre.slice(0, 2).map((g, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-hanok-teal/10 text-hanok-teal text-xs rounded-full"
                            >
                              {g}
                            </span>
                          ))}
                          {title.genre.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{title.genre.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {title.description || title.synopsis || 'No description available'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {filteredTitles.length > 6 && (
              <div className="text-center mt-6">
                <Link to="/creators/titles">
                  <Button variant="outline">
                    View All Titles ({filteredTitles.length})
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {filteredTitles.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Titles Yet</h3>
            <p className="text-gray-600">Check back later for your content titles</p>
          </div>
        )}
      </div>
    </div>
  );
}
