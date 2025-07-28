
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { titlesService, type Title } from "@/services/titlesService";
import { featuredService, type FeaturedWithTitle } from "@/services/featuredService";
import { useToast } from "@/components/ui/use-toast";

export default function Titles() {
  const { toast } = useToast();
  const [titles, setTitles] = useState<Title[]>([]);
  const [recentlyAddedTitle, setRecentlyAddedTitle] = useState<FeaturedWithTitle | null>(null);
  const [topRatedTitles, setTopRatedTitles] = useState<FeaturedWithTitle[]>([]);
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
      
      // Load featured data
      const [recentFeatured, topRatedFeatured] = await Promise.all([
        featuredService.getMostRecentFeatured(),
        featuredService.getFeaturedByViews(5)
      ]);
      
      setRecentlyAddedTitle(recentFeatured);
      setTopRatedTitles(topRatedFeatured);
      
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
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-12">
          {/* Recently Added */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Recently Added</h2>
            <div className="space-y-6">
              {recentlyAddedTitle ? (
                <Link key={recentlyAddedTitle.titles.title_id} to={`/titles/${recentlyAddedTitle.titles.title_id}`} className="block">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="relative">
                      <div className="h-64 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center p-6">
                        {recentlyAddedTitle.titles.title_image ? (
                          <img 
                            src={recentlyAddedTitle.titles.title_image} 
                            alt={recentlyAddedTitle.titles.title_name_en || recentlyAddedTitle.titles.title_name_kr}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <div className="flex space-x-4">
                              <div className="w-16 h-20 bg-gray-300 rounded-lg"></div>
                              <div className="w-20 h-24 bg-gray-200 rounded-lg"></div>
                              <div className="w-16 h-20 bg-gray-300 rounded-lg"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-6 left-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">
                          {recentlyAddedTitle.titles.title_name_en || recentlyAddedTitle.titles.title_name_kr}
                        </h3>
                        <button className="bg-hanok-teal text-white px-6 py-2 rounded-full text-sm font-medium">
                          FEATURED
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500">
                  No featured titles available
                </div>
              )}
            </div>
          </div>

          {/* Top Rated */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Top Rated</h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Title</span>
                  <span className="font-semibold text-gray-700">Views</span>
                </div>
              </div>
              <div className="divide-y">
                {topRatedTitles.length > 0 ? (
                  topRatedTitles.map((featuredTitle, index) => (
                    <Link key={featuredTitle.titles.title_id} to={`/titles/${featuredTitle.titles.title_id}`} className="block">
                      <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
                        <span className="text-gray-800 font-medium">
                          {featuredTitle.titles.title_name_en || featuredTitle.titles.title_name_kr}
                        </span>
                        <span className="text-gray-600">
                          {featuredTitle.titles.views?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No featured titles available
                  </div>
                )}
              </div>
            </div>
          </div>
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
                            <div className="w-12 h-16 bg-gray-200 rounded-lg overflow-hidden">
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
                            <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
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
