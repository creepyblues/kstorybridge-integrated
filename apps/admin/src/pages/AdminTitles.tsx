import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { titlesService, type Title } from "@/services/titlesService";
import { featuredService, type FeaturedWithTitle } from "@/services/featuredService";
import AdminLayout from "@/components/layout/AdminLayout";
import { enhancedSearch, getTitleSearchFields } from "@/utils/searchUtils";
import { toast } from "sonner";

export default function AdminTitles() {
  const navigate = useNavigate();
  const [titles, setTitles] = useState<Title[]>([]);
  const [featuredTitles, setFeaturedTitles] = useState<FeaturedWithTitle[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); // What user types
  const [searchTerm, setSearchTerm] = useState(""); // What's actually searched/filtered
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      
      // Load all titles for admins
      const allTitles = await titlesService.getAllTitles();
      setTitles(allTitles);
      
      // Load featured titles
      const featured = await featuredService.getFeaturedTitles();
      setFeaturedTitles(featured);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error loading titles");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update the actual search term (which triggers filtering)
    setSearchTerm(searchQuery.trim());
    
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
      const { exactMatches, expandedMatches } = enhancedSearch(
        titles,
        searchTerm,
        getTitleSearchFields()
      );
      result = [...exactMatches, ...expandedMatches];
    }
    
    // Apply sorting
    return sortTitles(result);
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredTitles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTitles = filteredTitles.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink leading-tight mb-4">TITLES</h1>
              <p className="text-xl text-midnight-ink-600 leading-relaxed">
                Manage and browse all Korean content titles.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-midnight-ink-600 text-lg font-medium">
                {filteredTitles.length} titles
              </div>
            <Button
              asChild
              size="sm"
              className="bg-hanok-teal hover:bg-hanok-teal/90 text-white"
            >
              <Link to="/titles/new">New title</Link>
            </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={loading}
                className="flex items-center gap-2 text-midnight-ink-600 border-porcelain-blue-300 hover:bg-porcelain-blue-100"
              >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Featured Titles Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Titles</h2>
          
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading featured titles...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {featuredTitles.map((featured) => {
                  const title = featured.titles;
                  return (
                    <Link key={featured.id} to={`/titles/${title.title_id}`} className="block">
                      <Card className="bg-white rounded-xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group h-full flex flex-col">
                        <div className="aspect-[3/4] bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal-100 flex items-center justify-center relative overflow-hidden">
                          {title.title_image ? (
                            <img 
                              src={title.title_image} 
                              alt={title.title_name_en || title.title_name_kr}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-hanok-teal rounded-full flex items-center justify-center">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                  <div className="w-4 h-4 bg-hanok-teal rounded opacity-60"></div>
                                </div>
                              </div>
                              <div className="absolute top-2 right-2 w-3 h-3 bg-hanok-teal rounded-full"></div>
                            </>
                          )}
                        </div>
                        <CardContent className="p-3 flex flex-col flex-grow">
                          <div className="flex-grow">
                            <h3 className="text-sm font-bold text-midnight-ink mb-1 line-clamp-2">
                              {title.title_name_en || title.title_name_kr}
                            </h3>
                            {title.title_name_en && title.title_name_kr && (
                              <p className="text-xs text-midnight-ink-500 mb-1 line-clamp-1">{title.title_name_kr}</p>
                            )}
                            <p className="text-xs text-midnight-ink-600 mb-2 line-clamp-2">
                              {title.tagline || title.pitch || 'Discover this amazing Korean story'}
                            </p>
                          </div>
                          {title.genre && (Array.isArray(title.genre) ? title.genre.length > 0 : true) && (
                            <div className="mt-auto">
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(title.genre) ? (
                                  title.genre.slice(0, 1).map((g, idx) => (
                                    <div key={`${title.title_id}-card-genre-${idx}`} className="inline-block bg-hanok-teal/10 text-hanok-teal px-2 py-1 rounded-full text-xs font-medium">
                                      {formatGenre(g)}
                                    </div>
                                  ))
                                ) : (
                                  <div className="inline-block bg-hanok-teal/10 text-hanok-teal px-2 py-1 rounded-full text-xs font-medium">
                                    {formatGenre(title.genre)}
                                  </div>
                                )}
                                {Array.isArray(title.genre) && title.genre.length > 1 && (
                                  <span className="text-xs text-gray-500">+{title.genre.length - 1}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-midnight-ink-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search titles... (press Enter or click Search)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-32 py-4 text-lg bg-porcelain-blue-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-hanok-teal text-midnight-ink"
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
                className="bg-hanok-teal hover:bg-hanok-teal/90 text-white"
              >
                Search
              </Button>
            </div>
          </form>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="grid grid-cols-12 gap-4 items-center font-semibold text-gray-700">
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
                <div className="col-span-2">Format</div>
              </div>
            </div>
            
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-500">
                Loading titles...
              </div>
            ) : filteredTitles.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {currentTitles.map((title) => (
                  <Link key={title.title_id} to={`/titles/${title.title_id}`} className="block">
                    <div className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="col-span-1">
                        {title.title_image ? (
                          <div className="w-16 h-20 bg-gray-200 rounded-lg overflow-hidden">
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
                          <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="col-span-3">
                        <div className="font-medium text-gray-800 line-clamp-1">
                          {title.title_name_en || title.title_name_kr}
                        </div>
                        {title.title_name_en && title.title_name_kr && (
                          <div className="text-sm text-gray-500 line-clamp-1 mt-1">
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
                              <span className="text-xs text-gray-500">+{title.genre.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        {title.tone ? (
                          <div className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                            {title.tone.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        {title.tags && title.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {title.tags.slice(0, 2).map((tag, idx) => (
                              <div key={`${title.title_id}-tag-${idx}`} className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                                {tag}
                              </div>
                            ))}
                            {title.tags.length > 2 && (
                              <span className="text-xs text-gray-500">+{title.tags.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        {title.content_format ? (
                          <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {formatContentFormat(title.content_format)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                {searchTerm ? "No titles found matching your search." : "No titles available."}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTitles.length)} of {filteredTitles.length} results
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
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = i + 1;
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
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
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
    </AdminLayout>
  );
}