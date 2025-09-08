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

// Mock favorites data for localhost development
const mockFavorites: FavoriteWithTitle[] = [
  {
    id: "fav-1",
    user_id: "mock-user-12345",
    title_id: "title-1",
    created_at: "2024-01-15T10:00:00Z",
    titles: {
      title_id: "title-1",
      title_name_en: "The Moon's Whisper",
      title_name_kr: "달의 속삭임",
      tagline: "A romantic fantasy about eternal love",
      genre: ["romance", "fantasy"],
      title_image: "https://via.placeholder.com/300x400/4A9B8E/ffffff?text=Moon",
      pitch: "A love story that transcends time and space",
      content_format: "webtoon",
      synopsis: "Sample synopsis",
      description: "Sample description"
    } as Title
  },
  {
    id: "fav-2",
    user_id: "mock-user-12345",
    title_id: "title-2",
    created_at: "2024-01-14T10:00:00Z",
    titles: {
      title_id: "title-2",
      title_name_en: "Seoul Shadows",
      title_name_kr: "서울의 그림자",
      tagline: "Mystery thriller in modern Seoul",
      genre: ["thriller", "mystery"],
      title_image: "https://via.placeholder.com/300x400/2C3E50/ffffff?text=Seoul",
      content_format: "webtoon",
      synopsis: "Sample synopsis",
      description: "Sample description"
    } as Title
  },
  {
    id: "fav-3",
    user_id: "mock-user-12345",
    title_id: "title-3",
    created_at: "2024-01-13T10:00:00Z",
    titles: {
      title_id: "title-3",
      title_name_en: "Dragon's Legacy",
      title_name_kr: "용의 유산",
      tagline: "Epic adventure in ancient Korea",
      genre: ["action", "adventure"],
      title_image: "https://via.placeholder.com/300x400/8B4513/ffffff?text=Dragon",
      content_format: "webtoon",
      synopsis: "Sample synopsis",
      description: "Sample description"
    } as Title
  }
];

export default function Favorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getFavorites, setFavorites, isFresh } = useDataCache();
  const [searchQuery, setSearchQuery] = useState(""); // What user types
  const [searchTerm, setSearchTerm] = useState(""); // What's actually searched/filtered
  const [loading, setLoading] = useState(false);

  // Localhost development configuration
  const isLocalhost = window.location.hostname === 'localhost';
  const useRealDataOnLocalhost = true; // Now using real Supabase data for localhost testing

  // Get data from cache or use mock data for localhost
  const favorites = (isLocalhost && !useRealDataOnLocalhost && !user) ? mockFavorites : getFavorites();

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
    // Handle localhost mock data
    if (isLocalhost && !useRealDataOnLocalhost && !user) {
      // For localhost development, just show a toast
      toast({ title: "Removed from favorites (localhost mock)" });
      console.log("Mock remove from favorites:", titleId);
      return;
    }
    
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

  // Only show login prompt in production or when real data is requested
  if (!user && (!isLocalhost || useRealDataOnLocalhost)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 sm:py-12 lg:py-16 px-3 sm:px-6 lg:px-8">
          <Card className="bg-white border-porcelain-blue-200 shadow-lg rounded-2xl">
            <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
              <Heart className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-midnight-ink-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-midnight-ink mb-2">Please log in</h3>
              <p className="text-sm sm:text-base text-midnight-ink-600">
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 sm:py-12 lg:py-16 px-3 sm:px-6 lg:px-8">
          <div className="text-center text-midnight-ink-600 py-6 sm:py-8 text-sm sm:text-base">Loading favorites...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink leading-tight mb-2 sm:mb-4">MY FAVORITES</h1>
              <p className="text-sm sm:text-base lg:text-xl text-midnight-ink-600 leading-relaxed">
                Content you've saved for later review.
              </p>
            </div>
            <div className="text-midnight-ink-600 text-sm sm:text-base lg:text-lg font-medium text-center sm:text-right">
              {filteredFavorites.length} favorites
            </div>
          </div>


          {/* Favorites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredFavorites.map((favorite) => {
            const title = favorite.titles;
            return (
              <Card key={favorite.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative">
                {/* Unfavorite Button */}
                <Button
                  id="favorites-remove-btn"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFromFavorites(title.title_id)}
                  className="absolute top-3 right-3 z-20 text-red-500 hover:text-red-600 hover:bg-red-50/80 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm bg-white/80 rounded-full p-2"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </Button>

                <Link to={`/buyers/titles/${title.title_id}`}>
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
                        <div className="absolute top-3 left-3">
                          <span className="text-xs font-medium px-2 py-1 rounded-full shadow-lg text-white" style={{backgroundColor: '#FF6B6B'}}>
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
            );
          })}
          </div>

          {filteredFavorites.length === 0 && (
            <Card className="bg-white border-porcelain-blue-200 shadow-lg rounded-2xl">
              <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
                <Heart className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-midnight-ink-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-midnight-ink mb-2">No favorites found</h3>
                <p className="text-sm sm:text-base text-midnight-ink-600">
                  {searchTerm ? "No favorites match your search." : "Start browsing content to add favorites."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  );
}
