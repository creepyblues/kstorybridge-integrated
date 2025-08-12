import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardContent, Input, Badge, useToast } from "@kstorybridge/ui";

import { 
  Search, 
  Heart, 
  Eye, 
  Star,
  Filter
} from "lucide-react";
import { favoritesService } from "@/services/favoritesService";
import { useAuth } from "@/hooks/useAuth";

import type { Title } from "@/services/titlesService";
import { enhancedSearch, getTitleSearchFields } from "@/utils/searchUtils";
import { useDataCache } from "@/contexts/DataCacheContext";
import { trackSearch } from "@/utils/analytics";

type FavoriteWithTitle = {
  id: string;
  user_id: string;
  title_id: string;
  created_at: string;
  titles: Title;
};

export default function Favorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getFavorites, setFavorites, isFresh } = useDataCache();
  const [searchQuery, setSearchQuery] = useState(""); // What user types
  const [searchTerm, setSearchTerm] = useState(""); // What's actually searched/filtered
  const [loading, setLoading] = useState(false);

  // Get data from cache
  const favorites = getFavorites();

  useEffect(() => {
    // Only load data if cache is empty or stale and user exists
    if (user && (favorites.length === 0 || !isFresh('favorites'))) {
      loadFavorites();
    }
  }, [user, favorites.length]); // Remove isFresh from dependencies

  // Filter favorites based on search term
  const filteredFavorites = (() => {
    if (!searchTerm.trim()) return favorites;
    
    // Extract titles from favorites for searching
    const titlesFromFavorites = favorites.map(fav => fav.titles);
    
    const { exactMatches, expandedMatches } = enhancedSearch(
      titlesFromFavorites,
      searchTerm,
      getTitleSearchFields()
    );
    
    // Combine exact and expanded matches with priority to exact matches
    const matchedTitles = [...exactMatches, ...expandedMatches];
    
    // Map back to FavoriteWithTitle objects
    return favorites.filter(favorite => 
      matchedTitles.some(matchedTitle => 
        matchedTitle.title_id === favorite.titles.title_id
      )
    );
  })();

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await favoritesService.getUserFavorites(user.id);
      setFavorites(data);
    } catch (error) {
      console.error("Error loading favorites:", error);
      toast({ title: "Error loading favorites", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update the actual search term (which triggers filtering)
    setSearchTerm(searchQuery.trim());
    
    // Track the search query when submitted
    if (searchQuery.trim().length > 0) {
      // Calculate result count for the search
      const titleObjects = favorites.map(f => f.titles);
      const { exactMatches, expandedMatches } = enhancedSearch(
        titleObjects,
        searchQuery.trim(),
        getTitleSearchFields()
      );
      const resultCount = exactMatches.length + expandedMatches.length;
      
      // Track the search query with favorites context
      trackSearch(searchQuery.trim(), resultCount, {
        userType: 'buyer', // Favorites are typically used by buyers
        searchContext: 'favorites',
        page: '/buyers/favorites'
      });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
  };

  const handleRemoveFromFavorites = async (titleId: string) => {
    if (!user) return;

    try {
      await favoritesService.removeFromFavorites(user.id, titleId);
      // Update cache by filtering out the removed favorite
      const updatedFavorites = favorites.filter(fav => fav.title_id !== titleId);
      setFavorites(updatedFavorites);
      toast({ title: "Removed from favorites" });
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast({ title: "Error removing from favorites", variant: "destructive" });
    }
  };

  const formatGenre = (genre: string | string[]) => {
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatContentFormat = (format: string) => {
    return format.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <Card className="bg-white border-porcelain-blue-200 shadow-lg rounded-2xl">
            <CardContent className="p-12 text-center">
              <Heart className="h-12 w-12 text-midnight-ink-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-midnight-ink mb-2">Please log in</h3>
              <p className="text-midnight-ink-600">
                You need to be logged in to view your favorites.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center text-midnight-ink-600 py-8">Loading favorites...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink leading-tight mb-4">MY FAVORITES</h1>
              <p className="text-xl text-midnight-ink-600 leading-relaxed">
                Content you've saved for later review.
              </p>
            </div>
            <div className="text-midnight-ink-600 text-lg font-medium">
              {filteredFavorites.length} favorites
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-midnight-ink-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your favorites... (press Enter or click Search)"
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

          {/* Divider */}
          <div className="border-t border-gray-200 my-12"></div>

          {/* Favorites Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          {filteredFavorites.map((favorite) => {
            const title = favorite.titles;
            return (
              <Card key={favorite.id} className="bg-white rounded-xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group relative h-full flex flex-col">
                {/* Unfavorite Button */}
                <Button
                  id="favorites-remove-btn"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFromFavorites(title.title_id)}
                  className="absolute top-2 right-2 z-10 text-red-500 hover:text-red-600 hover:bg-red-50/80 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm bg-white/80 rounded-full p-2"
                >
                  <Heart className="h-3 w-3 fill-current" />
                </Button>

                <Link to={`/titles/${title.title_id}`} className="block">
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
                </Link>
              </Card>
            );
          })}
          </div>

          {filteredFavorites.length === 0 && (
            <Card className="bg-white border-porcelain-blue-200 shadow-lg rounded-2xl">
              <CardContent className="p-12 text-center">
                <Heart className="h-12 w-12 text-midnight-ink-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-midnight-ink mb-2">No favorites found</h3>
                <p className="text-midnight-ink-600">
                  {searchTerm ? "No favorites match your search." : "Start browsing content to add favorites."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  );
}
