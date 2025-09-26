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

function HomeContent() {
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
              <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-midnight-ink leading-tight mb-2 sm:mb-4">HOME</h2>
              <p className="text-sm sm:text-base lg:text-xl text-midnight-ink-600 leading-relaxed">
                {isCreatorView ? "Welcome to your dashboard. Manage your Korean content titles." : "Welcome to your dashboard. Discover and browse Korean content titles."}
              </p>
            </div>
            {!isCreatorView && (
              <div className="text-midnight-ink-600 text-sm sm:text-base lg:text-lg font-medium text-right sm:text-left">
                {filteredTitles.length} titles
              </div>
            )}
          </div>

        {/* Featured Titles Section - Only show for buyers */}
        {!isCreatorView && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Featured Titles</h2>
            
            <FeaturedTitlesCarousel className="" />
          </div>
        )}

        {/* Divider - Only show for buyers */}
        {!isCreatorView && <div className="border-t border-gray-300 my-8 sm:my-12"></div>}

      </div>
    </div>
  );
}

export default function Home() {
  return (
    <TierProvider>
      <HomeContent />
    </TierProvider>
  );
}