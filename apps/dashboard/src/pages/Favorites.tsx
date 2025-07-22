
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
      return (
        title.title_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        title.title_name_kr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        title.author?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="space-y-8">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <Heart className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Please log in</h3>
            <p className="text-slate-400">
              You need to be logged in to view your favorites.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center text-slate-400 py-8">Loading favorites...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Favorites</h1>
          <p className="text-slate-400">
            Content you've saved for later review.
          </p>
        </div>
        <div className="text-slate-400">
          {filteredFavorites.length} favorites
        </div>
      </div>

      {/* Search */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search your favorites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Favorites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFavorites.map((favorite) => {
          const title = favorite.titles;
          return (
            <Card key={favorite.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                      {title.title_name_en || title.title_name_kr}
                    </h3>
                    {title.title_name_en && (
                      <p className="text-sm text-slate-400 mb-2">{title.title_name_kr}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFromFavorites(title.title_id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                </div>

                <p className="text-slate-300 text-sm mb-4 line-clamp-3">
                  {title.synopsis}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {title.genre && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                      {formatGenre(title.genre)}
                    </Badge>
                  )}
                  {title.content_format && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                      {formatContentFormat(title.content_format)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                  <span>By {title.author}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {title.views?.toLocaleString() || '0'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {title.likes || 0}
                    </span>
                    {title.rating && title.rating_count && title.rating_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-yellow-400" />
                        {title.rating}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link to={`/titles/${title.title_id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                      View Details
                    </Button>
                  </Link>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Start Deal
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredFavorites.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <Heart className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No favorites found</h3>
            <p className="text-slate-400">
              {searchTerm ? "No favorites match your search." : "Start browsing content to add favorites."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
