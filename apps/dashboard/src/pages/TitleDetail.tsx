
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Heart, Star, ExternalLink, Crown, FileText, X } from "lucide-react";
import { titlesService, type Title } from "@/services/titlesService";
import { favoritesService } from "@/services/favoritesService";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SecurePDFViewer from "@/components/SecurePDFViewer";
import PremiumFeaturePopup from "@/components/PremiumFeaturePopup";

export default function TitleDetail() {
  const { titleId } = useParams<{ titleId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [premiumPopupOpen, setPremiumPopupOpen] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState("");

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

  const formatViews = (views: number) => {
    if (!views) return '0';
    const formatted = views.toLocaleString();
    // Check if the number is rounded (ends with multiple zeros)
    if (views >= 1000 && views % 1000 === 0) {
      return `${formatted} (est)`;
    }
    return formatted;
  };

  const formatLikes = (likes: number) => {
    if (!likes || likes === 0) return 'N/A';
    return likes.toLocaleString();
  };

  if (loading) {
    return (
      <div>
        <div className="text-center text-gray-600 py-8">Loading title...</div>
      </div>
    );
  }

  if (!title) {
    return (
      <div>
        <div className="text-center text-gray-600 py-8">Title not found</div>
      </div>
    );
  }

  return (
    <div>
        {/* Title Card */}
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl mb-12">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  {title.title_name_en || title.title_name_kr}
                </h1>
                {title.title_name_kr && title.title_name_en && (
                  <p className="text-xl text-gray-600 font-medium mb-4">
                    {title.title_name_kr}
                  </p>
                )}
                
                {/* Story and Art Authors */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
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
              
              <div className="flex flex-col items-end gap-3 ml-6">
                {user && (
                  <Button
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    variant="outline"
                    className={isFavorited 
                      ? "border-hanok-teal bg-hanok-teal/5 text-hanok-teal hover:bg-hanok-teal hover:text-white shadow-lg rounded-2xl px-6 py-3" 
                      : "border-gray-300 text-gray-600 hover:border-hanok-teal hover:text-hanok-teal hover:bg-hanok-teal/5 shadow-lg rounded-2xl px-6 py-3"
                    }
                  >
                    <Heart className={`h-5 w-5 mr-2 ${isFavorited ? "fill-current" : ""}`} />
                    {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                  </Button>
                )}
                
                <Button 
                  onClick={() => {
                    setPremiumFeatureName("Contact Creator");
                    setPremiumPopupOpen(true);
                  }}
                  variant="outline" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 shadow-lg rounded-2xl px-6 py-3"
                >
                  Contact Creator
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Left Column - Cover Image and Title Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Cover Image */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              {title.title_image ? (
                <div className="w-full h-96 bg-gray-100 overflow-hidden">
                  <img 
                    src={title.title_image} 
                    alt={title.title_name_en || title.title_name_kr}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                      e.currentTarget.parentElement!.innerHTML = '<span class="text-gray-500">No Image Available</span>';
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                  <div className="flex space-x-4">
                    <div className="w-16 h-20 bg-gray-300 rounded-lg"></div>
                    <div className="w-20 h-24 bg-gray-200 rounded-lg"></div>
                    <div className="w-16 h-20 bg-gray-300 rounded-lg"></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* View Original Content */}
          {title.title_url && (
            <div className="border border-gray-200 rounded-lg p-3">
              <a 
                href={title.title_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-hanok-teal hover:text-hanok-teal/80 font-medium text-sm transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View Original Content
              </a>
            </div>
          )}

          {/* Tagline */}
          {title.tagline && (
            <div className="py-3 px-4 bg-hanok-teal/5 rounded-lg border-l-4 border-hanok-teal">
              <p className="text-gray-700 font-medium italic">
                "{title.tagline}"
              </p>
            </div>
          )}

          {/* Genre and Format Badges */}
          <div className="flex flex-wrap gap-2">
            {title.genre && (
              <Badge variant="outline" className="border-hanok-teal text-hanok-teal bg-hanok-teal/5 px-3 py-1">
                {formatGenre(title.genre)}
              </Badge>
            )}
            {title.content_format && (
              <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-50 px-3 py-1">
                {formatContentFormat(title.content_format)}
              </Badge>
            )}
          </div>

          {/* Statistics Card */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Statistics */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Statistics</h4>
                  <div className="space-y-3">
                    {/* Views and Likes on same line */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600">Views</p>
                          <p className="font-semibold text-gray-800 text-sm">{formatViews(title.views || 0)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                        <Heart className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-600">Likes</p>
                          <p className="font-semibold text-gray-800 text-sm">{formatLikes(title.likes || 0)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rating on separate line if exists */}
                    {title.rating && title.rating_count && title.rating_count > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-sm text-gray-600">Rating</p>
                          <p className="font-semibold text-gray-800">{title.rating.toFixed(1)} ({title.rating_count} reviews)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Note Card - Only show if note exists */}
          {title.note && (
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-gray-800 text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-hanok-teal" />
                  Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gradient-to-r from-hanok-teal/5 to-porcelain-blue-50 rounded-lg border-l-4 border-hanok-teal">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {title.note}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Description and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Synopsis */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-gray-800 text-xl">Synopsis</CardTitle>
              {title.pitch && user && (
                <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-700 text-white shadow-xl border-0 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 transform hover:scale-110 hover:shadow-2xl relative overflow-hidden group">
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                      
                      {/* Icons */}
                      <Crown className="h-4 w-4 mr-2 text-yellow-300 animate-pulse" />
                      <FileText className="h-4 w-4 mr-2" />
                      
                      {/* Text */}
                      <span className="relative z-10">View Pitch (Premium)</span>
                      
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-full bg-purple-400/50 blur-md group-hover:bg-purple-300/60 transition-colors duration-300"></div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] p-0">
                    <DialogHeader className="p-6 pb-0">
                      <DialogTitle className="flex items-center justify-between">
                        <span>Pitch Document - {title.title_name_en || title.title_name_kr}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsPdfModalOpen(false)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Close</span>
                        </Button>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 pt-0">
                      <SecurePDFViewer 
                        pdfUrl={title.pitch} 
                        title={`${title.title_name_en || title.title_name_kr} - Pitch Document`}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              {title.pitch && !user && (
                <Button
                  disabled
                  className="bg-gray-400 text-gray-600 shadow-lg border-0 rounded-full px-5 py-2.5 text-sm font-medium cursor-not-allowed relative"
                >
                  <Crown className="h-4 w-4 mr-2 text-gray-500" />
                  <FileText className="h-4 w-4 mr-2" />
                  View Pitch (Premium)
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </Button>
              )}

              {!title.pitch && user && (
                <Button 
                  onClick={() => {
                    setPremiumFeatureName("Request a pitch deck");
                    setPremiumPopupOpen(true);
                  }}
                  className="bg-gradient-to-r from-hanok-teal via-hanok-teal to-blue-600 hover:from-hanok-teal/90 hover:via-hanok-teal/90 hover:to-blue-700 text-white shadow-xl border-0 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 transform hover:scale-110 hover:shadow-2xl relative overflow-hidden group"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                  
                  {/* Icons */}
                  <FileText className="h-4 w-4 mr-2" />
                  
                  {/* Text */}
                  <span className="relative z-10">Request a pitch deck</span>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-hanok-teal/50 blur-md group-hover:bg-hanok-teal/60 transition-colors duration-300"></div>
                </Button>
              )}

              {!title.pitch && !user && (
                <Button
                  disabled
                  className="bg-gray-400 text-gray-600 shadow-lg border-0 rounded-full px-5 py-2.5 text-sm font-medium cursor-not-allowed relative"
                >
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  Request a pitch deck
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {title.description ? (
                  <p className="text-gray-700 leading-relaxed text-lg">{title.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available for this title.</p>
                )}
                
                {/* Premium Feature Notice */}
                {title.pitch && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">Premium Content Available</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Premium Content Available by request. Request a detailed pitch document with comprehensive information about the story, target audience, and market positioning.
                    </p>
                  </div>
                )}
                
                {!title.pitch && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-hanok-teal/10 to-blue-50 border border-hanok-teal/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-hanok-teal" />
                      <span className="font-semibold text-hanok-teal">Premium Content Available</span>
                    </div>
                    <p className="text-sm text-hanok-teal/80">
                      Premium Content Available by request. Request a detailed pitch document with comprehensive information about the story, target audience, and market positioning.
                    </p>
                  </div>
                )}
                
                {/* Market Information */}
                <div className="pt-6 border-t border-gray-200 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-bold text-gray-600 mb-1">Perfect For</h5>
                      <p className="text-gray-800 text-lg">{title.perfect_for || 'Not specified'}</p>
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-600 mb-1">Comps</h5>
                      <p className="text-gray-800 text-lg">{title.comps || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-bold text-gray-600 mb-1">Tone</h5>
                      <p className="text-gray-800 text-lg">{title.tone || 'Not specified'}</p>
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-600 mb-1">Audience</h5>
                      <p className="text-gray-800 text-lg">{title.audience || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Title Information and Details */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-800 text-xl">Title Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Creator Information */}
                <div className="space-y-4">
                  {title.author && (
                    <div>
                      <h5 className="font-medium text-gray-600 mb-1">Story Author (Original Author)</h5>
                      <p className="text-gray-800 text-lg">{title.author}</p>
                    </div>
                  )}
                  {title.writer && (
                    <div>
                      <h5 className="font-medium text-gray-600 mb-1">Writer</h5>
                      <p className="text-gray-800 text-lg">{title.writer}</p>
                    </div>
                  )}
                  {title.illustrator && (
                    <div>
                      <h5 className="font-medium text-gray-600 mb-1">Art Author (Artist)</h5>
                      <p className="text-gray-800 text-lg">{title.illustrator}</p>
                    </div>
                  )}
                  <div>
                    <h5 className="font-bold text-gray-600 mb-1">Rights Owner</h5>
                    <p className="text-gray-800 text-lg">{title.rights || 'Not specified'}</p>
                  </div>
                </div>

                {/* Right Column - Content Details */}
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-gray-600 mb-1">Series Status</h5>
                    <p className="text-gray-800 text-lg">
                      {title.completed !== null && title.completed !== undefined ? String(title.completed) : 'null'}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-600 mb-1">Number of Chapters</h5>
                    <p className="text-gray-800 text-lg">{title.chapters?.toLocaleString() || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Tags */}
          {title.tags && title.tags.length > 0 && (
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-gray-800 text-xl">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {title.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700 px-3 py-1 text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
      
      {/* Premium Feature Popup */}
      <PremiumFeaturePopup
        isOpen={premiumPopupOpen}
        onClose={() => setPremiumPopupOpen(false)}
        featureName={premiumFeatureName}
      />
      
    </div>
  );
}
