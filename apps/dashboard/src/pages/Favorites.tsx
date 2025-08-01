
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Heart, 
  Eye, 
  Star,
  Filter
} from "lucide-react";
import { favoritesService } from "@/services/favoritesService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import type { Title } from "@/services/titlesService";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<FavoriteWithTitle[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteWithTitle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  useEffect(() => {
    const filtered = favorites.filter(favorite => {
      const title = favorite.titles;
      const searchLower = searchTerm.toLowerCase();
      return (
        // Title names
        title.title_name_en?.toLowerCase().includes(searchLower) ||
        title.title_name_kr.toLowerCase().includes(searchLower) ||
        // Author information
        title.author?.toLowerCase().includes(searchLower) ||
        title.story_author?.toLowerCase().includes(searchLower) ||
        title.art_author?.toLowerCase().includes(searchLower) ||
        title.writer?.toLowerCase().includes(searchLower) ||
        title.illustrator?.toLowerCase().includes(searchLower) ||
        title.rights?.toLowerCase().includes(searchLower) ||
        title.rights_owner?.toLowerCase().includes(searchLower) ||
        // Content descriptions
        title.tagline?.toLowerCase().includes(searchLower) ||
        title.description?.toLowerCase().includes(searchLower) ||
        title.synopsis?.toLowerCase().includes(searchLower) ||
        title.note?.toLowerCase().includes(searchLower) ||
        // Market information
        title.perfect_for?.toLowerCase().includes(searchLower) ||
        title.comps?.toLowerCase().includes(searchLower) ||
        title.tone?.toLowerCase().includes(searchLower) ||
        title.audience?.toLowerCase().includes(searchLower) ||
        // Genre and tags
        title.genre?.toLowerCase().includes(searchLower) ||
        title.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    });
    setFilteredFavorites(filtered);
  }, [searchTerm, favorites]);

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

  const handleRemoveFromFavorites = async (titleId: string) => {
    if (!user) return;

    try {
      await favoritesService.removeFromFavorites(user.id, titleId);
      setFavorites(prev => prev.filter(fav => fav.title_id !== titleId));
      toast({ title: "Removed from favorites" });
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast({ title: "Error removing from favorites", variant: "destructive" });
    }
  };

  const formatGenre = (genre: string) => {
    return genre.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-12">
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
          <div className="relative mb-12">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-midnight-ink-400 w-5 h-5" />
            <input
              placeholder="Search your favorites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg bg-porcelain-blue-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-hanok-teal text-midnight-ink"
            />
          </div>

          {/* Favorites Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-16">
          {filteredFavorites.map((favorite) => {
            const title = favorite.titles;
            return (
              <Card key={favorite.id} className="bg-white rounded-xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group relative h-full flex flex-col">
                {/* Unfavorite Button */}
                <Button
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
                    {title.genre && (
                      <div className="mt-auto">
                        <div className="inline-block bg-hanok-teal/10 text-hanok-teal px-2 py-1 rounded-full text-xs font-medium">
                          {formatGenre(title.genre)}
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
