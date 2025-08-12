import { useState, useEffect } from "react";
import { Button, Card, CardContent, Input } from "@kstorybridge/ui";

import { Search } from "lucide-react";
import { titlesService, type Title } from "@/services/titlesService";
import { featuredService, type FeaturedWithTitle } from "@/services/featuredService";

export default function TitlesList() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [featuredTitles, setFeaturedTitles] = useState<FeaturedWithTitle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Romance", "Drama", "Supernatural", "Period"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load featured titles
      const featured = await featuredService.getFeaturedTitles();
      setFeaturedTitles(featured || []);
      
      // Load all titles
      const allTitles = await titlesService.getAllTitles();
      setTitles(allTitles || []);
      
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatGenre = (genre: string | string[]) => {
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink leading-tight mb-4">TITLES</h1>
          <p className="text-xl text-midnight-ink-600 leading-relaxed">
            Manage and browse all Korean content titles.
          </p>
        </div>
        <div className="text-midnight-ink-600 text-lg font-medium">
          {titles.length} titles
        </div>
      </div>

      {/* Featured Titles Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Titles</h2>
        
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading featured titles...</div>
        ) : featuredTitles.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No featured titles available at the moment.</p>
            <p className="text-sm mt-2">Check back later for new content!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {featuredTitles.map((featured) => {
              const title = featured.titles;
              return (
                <Card key={featured.id} className="bg-white rounded-xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group h-full flex flex-col">
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
                              <div key={idx} className="inline-block bg-hanok-teal/10 text-hanok-teal px-2 py-1 rounded-full text-xs font-medium">
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}