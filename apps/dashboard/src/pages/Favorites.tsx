import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardContent, Input, Badge } from "@kstorybridge/ui";
import { useToast } from "@/hooks/use-toast";

import {
  Search,
  Heart,
  Eye,
  Star,
  Filter
} from "lucide-react";
import { favoritesService } from "@/services/favoritesService";
import { useAuth } from "@/hooks/useAuth";
import { useSessionCache } from "@/hooks/useSessionCache";
import { directApiService } from "@/services/directApiService";

import type { Title } from "@/services/titlesService";
import { enhancedSearch, getTitleSearchFields } from "@/utils/searchUtils";
import { useDataCache } from "@/contexts/DataCacheContext";
import { trackSearch, trackSavedTitle } from "@/utils/analytics";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/design-system";
import { FavoritesUpgradePrompt } from "@/components/UpgradePrompt";
import { triggerMultipleSavesEmail } from "@/services/emailService";
import { useTierAccess } from "@/hooks/useTierAccess";

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
  const { tier } = useTierAccess();
  const { getFavorites, setFavorites, isFresh, isSessionValid, getDbConnectivityStatus, setDbConnectivityStatus } = useDataCache();
  const { } = useSessionCache(); // Initialize session cache management
  const [searchQuery, setSearchQuery] = useState(""); // What user types
  const [searchTerm, setSearchTerm] = useState(""); // What's actually searched/filtered
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Get data from cache - NO FALLBACK TO MOCK DATA
  const favorites = getFavorites();
  const dbStatus = getDbConnectivityStatus();

  useEffect(() => {
    // NEW POLICY: Always fetch from database on new session
    // Only use cache if session is valid and data is fresh
    if (user && (!isSessionValid() || favorites.length === 0 || !isFresh('favorites'))) {
      loadFavorites();
    }
  }, [user, isSessionValid]); // Depend on session validity

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
    if (!user) {
      console.error('❌ FAVORITES PAGE: No user available for loading favorites');
      return;
    }

    console.log('📖 FAVORITES PAGE: Starting to load favorites...');
    console.log('📖 FAVORITES PAGE: User object:', {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    });

    try {
      setLoading(true);
      setDbError(null);

      console.log('📖 FAVORITES PAGE: Calling directApiService.getUserFavorites (bypassing hanging Supabase client)...');

      // Use directApiService to bypass the hanging Supabase JS client
      const data = await directApiService.getUserFavorites(user.id);

      console.log('📖 FAVORITES PAGE: Received data from service:', data);

      // Update cache and connectivity status
      setFavorites(data);
      setDbConnectivityStatus({ isConnected: true });

      console.log(`✅ FAVORITES PAGE: Successfully loaded ${data.length} favorites from database`);

      // PRD 2.1: Trigger conversion email when user has saved multiple titles (5+)
      if (user && data.length >= 5 && tier === 'basic') {
        try {
          const userName = user.user_metadata?.full_name || user.email || 'User';
          await triggerMultipleSavesEmail(
            user.id,
            user.email,
            userName,
            tier,
            data.length
          );
        } catch (emailError) {
          console.warn('Failed to trigger multiple saves email:', emailError);
          // Don't fail the favorites loading if email fails
        }
      }
    } catch (error) {
      console.error("❌ FAVORITES PAGE: Error loading favorites:", error);

      // Update connectivity status
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      setDbConnectivityStatus({ isConnected: false, error: errorMessage });
      setDbError(errorMessage);

      // NEW POLICY: Show database error to user instead of fallback
      toast({
        title: "Database Connection Error",
        description: "Unable to load favorites. Please check your connection and try again.",
        variant: "destructive"
      });
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
        searchContext: 'saved',
        page: '/buyers/saved'
      });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
  };

  const handleRemoveFromFavorites = async (titleId: string) => {
    if (!user) return;

    // Find the title being removed for analytics tracking
    const titleBeingRemoved = favorites.find(fav => fav.title_id === titleId);
    const titleName = titleBeingRemoved?.titles?.title_name_en || titleBeingRemoved?.titles?.title_name_kr || 'Unknown Title';

    try {
      console.log('🗑️ Removing from favorites:', { userId: user.id, titleId });

      // Use directApiService to bypass the hanging Supabase JS client
      await directApiService.removeFromFavorites(user.id, titleId);

      // Update cache by filtering out the removed favorite
      const updatedFavorites = favorites.filter(fav => fav.title_id !== titleId);
      setFavorites(updatedFavorites);

      // Track the unsave action (remove from saved titles)
      trackSavedTitle(titleId, titleName, 'saved', user.id, 'remove');

      toast({
        title: "Removed from saved titles",
        description: "This title has been removed from your saved titles"
      });

      console.log('✅ Successfully removed from favorites');
    } catch (error) {
      console.error("❌ Error removing from favorites:", error);
      toast({
        title: "Error removing from favorites",
        description: "Please try again.",
        variant: "destructive"
      });
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

  // NEW POLICY: Always require login - no mock data fallback
  if (!user) {
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
          <div className="text-center text-midnight-ink-600 py-6 sm:py-8 text-sm sm:text-base">Loading favorites from database...</div>
        </div>
      </div>
    );
  }

  // NEW POLICY: Show database connectivity error if connection failed
  if (dbError && !dbStatus.isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 sm:py-12 lg:py-16 px-3 sm:px-6 lg:px-8">
          <Card className="bg-white border-red-200 shadow-lg rounded-2xl">
            <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
              <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-red-600 text-lg font-bold">!</span>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-red-600 mb-2">Database Connection Error</h3>
              <p className="text-sm sm:text-base text-red-500 mb-4">
                Unable to connect to the database. Please check your internet connection.
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Error: {dbError}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700"
              >
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
        {/* Header */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-midnight-ink leading-tight mb-2 sm:mb-4">SAVED TITLES</h2>
            </div>
          </div>

          {/* PRD 2.1: Upgrade prompt for basic tier users */}
          <div className="mb-6">
            <FavoritesUpgradePrompt
              variant="banner"
              size="md"
              customMessage={favorites.length >= 5
                ? `You've saved ${favorites.length} titles! Unlock unlimited saves and advanced features with Pro.`
                : "Save unlimited titles and organize them with Pro features."
              }
            />
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
                          Array.isArray(title.genre) ? (
                            title.genre.map((g, idx) => (
                              <span key={`${title.title_id}-genre-${idx}`} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {formatGenre(g)}
                              </span>
                            ))
                          ) : (
                            <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {formatGenre(title.genre)}
                            </span>
                          )
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

          {filteredFavorites.length === 0 && dbStatus.isConnected && (
            <EmptyState
              icon={Heart}
              title="No saved titles found"
            />
          )}
        </div>
    </PageContainer>
  );
}
