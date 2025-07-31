
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { titlesService, type Title } from "@/services/titlesService";
import { featuredService, type FeaturedWithTitle } from "@/services/featuredService";
import { useToast } from "@/components/ui/use-toast";

export default function Titles() {
  const { toast } = useToast();
  const [titles, setTitles] = useState<Title[]>([]);
  const [featuredTitles, setFeaturedTitles] = useState<FeaturedWithTitle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all titles for the main table
      const allTitles = await titlesService.getAllTitles();
      setTitles(allTitles);
      
      // Load featured titles
      const featured = await featuredService.getFeaturedTitles();
      setFeaturedTitles(featured);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredTitles = titles.filter(title => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      title.title_name_kr?.toLowerCase().includes(searchLower) ||
      title.title_name_en?.toLowerCase().includes(searchLower) ||
      title.author?.toLowerCase().includes(searchLower) ||
      title.writer?.toLowerCase().includes(searchLower) ||
      title.illustrator?.toLowerCase().includes(searchLower) ||
      title.genre?.toLowerCase().includes(searchLower)
    );
  });

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatGenre = (genre: string) => {
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatContentFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Title List</h1>
        </div>

        {/* Featured Titles Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Featured Titles</h2>
          
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading featured titles...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {featuredTitles.map((featured) => {
                const title = featured.titles;
                return (
                  <Link key={featured.id} to={`/titles/${title.title_id}`} className="block">
                    <Card className="bg-white rounded-xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                      <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center relative overflow-hidden">
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
                      <CardContent className="p-3">
                        <h3 className="text-sm font-bold text-gray-800 mb-1 line-clamp-2">
                          {title.title_name_en || title.title_name_kr}
                        </h3>
                        {title.title_name_en && title.title_name_kr && (
                          <p className="text-xs text-gray-500 mb-1 line-clamp-1">{title.title_name_kr}</p>
                        )}
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {title.tagline || title.pitch || 'Discover this amazing Korean story'}
                        </p>
                        {title.genre && (
                          <div className="inline-block bg-hanok-teal/10 text-hanok-teal px-2 py-1 rounded-full text-xs font-medium">
                            {formatGenre(title.genre)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
          
          {!loading && featuredTitles.length === 0 && (
            <div className="text-center text-gray-500 py-8">No featured titles available.</div>
          )}
        </div>

        {/* All Titles Table */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">All Titles</h2>
          
          {/* Search Bar */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search titles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-hanok-teal"
            />
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="grid grid-cols-8 gap-4 items-center font-semibold text-gray-700">
                <div className="col-span-1">Image</div>
                <div className="col-span-3">Title</div>
                <div className="col-span-2">Genre</div>
                <div className="col-span-1">Views</div>
                <div className="col-span-1">Likes</div>
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
                      <div className="px-6 py-4 grid grid-cols-8 gap-4 items-center hover:bg-gray-50 cursor-pointer transition-colors">
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
                          {title.genre ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-hanok-teal/10 text-hanok-teal">
                              {formatGenre(title.genre)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        
                        <div className="col-span-1 text-gray-600 text-sm">
                          {title.views?.toLocaleString() || '0'}
                        </div>
                        
                        <div className="col-span-1 text-gray-600 text-sm">
                          {title.likes?.toLocaleString() || '0'}
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
                      className="text-gray-600 border-gray-300 hover:bg-gray-100"
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
                              : "text-gray-600 border-gray-300 hover:bg-gray-100"
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
                      className="text-gray-600 border-gray-300 hover:bg-gray-100"
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
  );
}
