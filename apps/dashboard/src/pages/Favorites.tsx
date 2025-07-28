
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
      <div>
        <Card className="bg-white border-gray-200 shadow-lg">
          <CardContent className="p-12 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Please log in</h3>
            <p className="text-gray-600">
              You need to be logged in to view your favorites.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="text-center text-gray-600 py-8">Loading favorites...</div>
      </div>
    );
  }

  return (
    <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">My Favorites</h1>
            <p className="text-gray-600">
              Content you've saved for later review.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-gray-600">
              {filteredFavorites.length} favorites
            </div>
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            placeholder="Search your favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-hanok-teal"
          />
        </div>

        {/* Favorites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredFavorites.map((favorite) => {
            const title = favorite.titles;
            return (
              <Card key={favorite.id} className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow group rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {title.title_image && (
                      <div className="w-16 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={title.title_image} 
                          alt={title.title_name_en || title.title_name_kr}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link to={`/titles/${title.title_id}`}>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2 hover:text-hanok-teal transition-colors cursor-pointer">
                          {title.title_name_en || title.title_name_kr}
                        </h3>
                      </Link>
                      {title.title_name_en && (
                        <p className="text-sm text-gray-600 mb-2">{title.title_name_kr}</p>
                      )}
                      
                      {/* Story and Art Authors */}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                        {title.story_author && (
                          <div>
                            <span className="font-medium">Story by</span> {title.story_author}
                          </div>
                        )}
                        {title.art_author && (
                          <div>
                            <span className="font-medium">Art by</span> {title.art_author}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromFavorites(title.title_id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {title.synopsis}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {title.genre && (
                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                        {formatGenre(title.genre)}
                      </Badge>
                    )}
                    {title.content_format && (
                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                        {formatContentFormat(title.content_format)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>{title.author}</span>
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
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                          {title.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/titles/${title.title_id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full border-gray-300 text-gray-700 hover:text-gray-800 hover:bg-gray-50">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredFavorites.length === 0 && (
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-12 text-center">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No favorites found</h3>
              <p className="text-gray-600">
                {searchTerm ? "No favorites match your search." : "Start browsing content to add favorites."}
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
