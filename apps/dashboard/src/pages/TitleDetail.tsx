
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Heart, Star, ExternalLink } from "lucide-react";
import { titlesService, type Title } from "@/services/titlesService";
import { favoritesService } from "@/services/favoritesService";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function TitleDetail() {
  const { titleId } = useParams<{ titleId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (titleId) {
      loadTitle(titleId);
      if (user) {
        checkIfFavorited(titleId);
      }
    }
  }, [titleId, user]);

  const loadTitle = async (id: string) => {
    try {
      setLoading(true);
      const data = await titlesService.getTitleById(id);
      setTitle(data);
    } catch (error) {
      console.error("Error loading title:", error);
      toast({ title: "Error loading title", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorited = async (titleId: string) => {
    if (!user) return;
    
    try {
      const favorited = await favoritesService.isTitleFavorited(user.id, titleId);
      setIsFavorited(favorited);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user || !titleId) return;

    try {
      setFavoriteLoading(true);
      
      if (isFavorited) {
        await favoritesService.removeFromFavorites(user.id, titleId);
        setIsFavorited(false);
        toast({ title: "Removed from favorites" });
      } else {
        await favoritesService.addToFavorites(user.id, titleId);
        setIsFavorited(true);
        toast({ title: "Added to favorites" });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({ 
        title: "Error updating favorites", 
        variant: "destructive" 
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  const formatGenre = (genre: string) => {
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatContentFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center text-slate-400 py-8">Loading title...</div>
      </div>
    );
  }

  if (!title) {
    return (
      <div className="space-y-6">
        <div className="text-center text-slate-400 py-8">Title not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/titles">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Titles
          </Button>
        </Link>
        
        {user && (
          <Button
            onClick={handleFavoriteToggle}
            disabled={favoriteLoading}
            variant={isFavorited ? "default" : "outline"}
            className={isFavorited 
              ? "bg-red-600 hover:bg-red-700 text-white" 
              : "border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            }
          >
            <Heart className={`h-4 w-4 mr-2 ${isFavorited ? "fill-current" : ""}`} />
            {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Title Image */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              {title.title_image ? (
                <div className="w-full h-96 bg-slate-700 rounded border border-slate-600 overflow-hidden">
                  <img 
                    src={title.title_image} 
                    alt={title.title_name_en || title.title_name_kr}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                      e.currentTarget.parentElement!.innerHTML = '<span class="text-slate-500">No Image Available</span>';
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-96 bg-slate-700 rounded border border-slate-600 flex items-center justify-center">
                  <span className="text-slate-500">No Image Available</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Title Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                {title.title_name_en || title.title_name_kr}
              </CardTitle>
              {title.title_name_en && title.title_name_kr && (
                <CardDescription className="text-slate-400 text-lg">
                  {title.title_name_kr}
                </CardDescription>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {title.genre && (
                  <Badge variant="outline" className="border-blue-600/30 text-blue-400">
                    {formatGenre(title.genre)}
                  </Badge>
                )}
                {title.content_format && (
                  <Badge variant="outline" className="border-purple-600/30 text-purple-400">
                    {formatContentFormat(title.content_format)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {title.author && (
                    <div>
                      <h4 className="font-medium text-slate-300 mb-1">Author</h4>
                      <p className="text-white">{title.author}</p>
                    </div>
                  )}
                  {title.writer && (
                    <div>
                      <h4 className="font-medium text-slate-300 mb-1">Writer</h4>
                      <p className="text-white">{title.writer}</p>
                    </div>
                  )}
                  {title.illustrator && (
                    <div>
                      <h4 className="font-medium text-slate-300 mb-1">Illustrator</h4>
                      <p className="text-white">{title.illustrator}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Eye className="h-4 w-4" />
                      <span>{title.views?.toLocaleString() || '0'} views</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Heart className="h-4 w-4" />
                      <span>{title.likes?.toLocaleString() || '0'} likes</span>
                    </div>
                    {title.rating && title.rating_count && title.rating_count > 0 && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Star className="h-4 w-4" />
                        <span>{title.rating.toFixed(1)} ({title.rating_count})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Synopsis */}
          {title.synopsis && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Synopsis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed">{title.synopsis}</p>
              </CardContent>
            </Card>
          )}

          {/* Pitch */}
          {title.pitch && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Pitch</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed">{title.pitch}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {title.tags && title.tags.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {title.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-slate-700/50 text-slate-300">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* External Link */}
          {title.title_url && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <a 
                  href={title.title_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Original Content
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
