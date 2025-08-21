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
    refreshData 
  } = useDataCache();
  
  const [searchQuery, setSearchQuery] = useState(""); // What user types
  const [searchTerm, setSearchTerm] = useState(""); // What's actually searched/filtered
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [sortField, setSortField] = useState<string | null>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    const dataKey = isCreatorView ? 'creatorTitles' : 'titles';
    refreshData(dataKey);
    // Featured titles refresh is handled by the FeaturedTitlesCarousel component
    loadData(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update the actual search term (which triggers filtering)
    setSearchTerm(searchQuery.trim());
    
    // Track the search query when submitted
    if (searchQuery.trim().length > 0) {
      // Calculate result count for the search
      const { exactMatches, expandedMatches, phraseMatches } = enhancedSearch(
        titles,
        searchQuery.trim(),
        getTitleSearchFields()
      );
      const resultCount = exactMatches.length + expandedMatches.length + phraseMatches.length;
      
      // Track the search query with enhanced context
      trackSearch(searchQuery.trim(), resultCount, {
        userType: isCreatorView ? 'creator' : 'buyer',
        searchContext: 'main',
        page: location.pathname
      });
    }
    
    // Reset to first page on new search
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
    setCurrentPage(1);
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
    let result = titles;
    
    // Apply search filter first
    if (searchTerm) {
      const { exactMatches, expandedMatches, phraseMatches } = enhancedSearch(
        titles,
        searchTerm,
        getTitleSearchFields()
      );
      // Combine results with proper ordering: exact matches first, then phrase matches, then expanded matches
      result = [...exactMatches, ...phraseMatches, ...expandedMatches];
    }
    
    // Apply sorting (but preserve search relevance order when there's a search term)
    return searchTerm ? result : sortTitles(result);
  })();

  // Reset pagination when search term or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection]);

  const formatGenre = (genre: string | string[]) => {
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatContentFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
          <form onSubmit={handleSearchSubmit} className="relative mb-6 sm:mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-midnight-ink-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-24 sm:pr-32 py-3 sm:py-4 text-sm sm:text-base lg:text-lg bg-porcelain-blue-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-hanok-teal text-midnight-ink"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
              {searchTerm && (
                <Button
                  type="button"
                  onClick={handleClearSearch}
                  variant="ghost"
                  size="sm"
                  className="text-midnight-ink-400 hover:text-midnight-ink-600"
                >
                  Clear
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                className="bg-gradient-to-r from-hanok-teal via-hanok-teal to-blue-600 hover:from-hanok-teal/90 hover:via-hanok-teal/90 hover:to-blue-700 text-white shadow-lg hover:shadow-xl border-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 transform hover:scale-105 relative overflow-hidden group"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                
                {/* Search icon */}
                <Search className="h-3 w-3 mr-1 pointer-events-none" />
                
                {/* Text */}
                <span className="relative z-10 pointer-events-none">Search</span>
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-xl bg-hanok-teal/50 blur-md group-hover:bg-hanok-teal/60 transition-colors duration-300 pointer-events-none"></div>
              </Button>
            </div>
          </form>
          
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
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(title.genre) ? (
                                title.genre.slice(0, 2).map((g, idx) => (
                                  <div key={`${title.title_id}-genre-${idx}`} className="inline-block bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {formatGenre(g)}
                                  </div>
                                ))
                              ) : (
                                <div className="inline-block bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {formatGenre(title.genre)}
                                </div>
                              )}
                              {Array.isArray(title.genre) && title.genre.length > 2 && (
                                <span className="inline-flex items-center text-xs text-gray-500 ml-1">+{title.genre.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        
                        <div className="col-span-2">
                          {title.tone ? (
                            <div className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                              {title.tone}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        
                        <div className="col-span-2">
                          {((title as any).keywords || title.tags) && ((title as any).keywords || title.tags).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {((title as any).keywords || title.tags).slice(0, 2).map((tag: string, idx: number) => (
                                <div key={`${title.title_id}-keyword-${idx}`} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {tag}
                                </div>
                              ))}
                              {((title as any).keywords || title.tags).length > 2 && (
                                <span className="inline-flex items-center text-gray-500 text-xs ml-1">
                                  +{((title as any).keywords || title.tags).length - 2}
                                </span>
                              )}
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
                                  <div key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium truncate max-w-[150px]" title={comp}>
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
                                <span className="bg-hanok-teal text-white text-xs font-medium px-2 py-0.5 rounded-full mr-2">
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
                                    <span key={idx} className="inline-block bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                                      {formatGenre(g)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="inline-block bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                                    {formatGenre(title.genre)}
                                  </span>
                                )
                              )}
                              {Array.isArray(title.genre) && title.genre.length > 2 && (
                                <span className="text-xs text-gray-500">+{title.genre.length - 2}</span>
                              )}
                              
                              {title.tone && (
                                <span className="inline-block bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
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
