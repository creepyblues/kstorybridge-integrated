
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
import { useDataCache } from "@/contexts/DataCacheContext";
import SecurePDFViewer from "@/components/SecurePDFViewer";
import PremiumFeaturePopup from "@/components/PremiumFeaturePopup";
import PremiumColumn from "@/components/PremiumColumn";

export default function TitleDetail() {
  const { titleId } = useParams<{ titleId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check if we should bypass auth for localhost development
  const shouldBypassAuth = () => {
    const isLocalhost = window.location.hostname === 'localhost';
    const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
    const isDev = import.meta.env.DEV;
    return isLocalhost && (bypassEnabled || isDev);
  };

  // For localhost auth bypass, consider as authenticated
  const isAuthenticated = user || shouldBypassAuth();
  const { getTitleDetail, setTitleDetail, isFresh } = useDataCache();
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [premiumPopupOpen, setPremiumPopupOpen] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState("");

  useEffect(() => {
    if (titleId) {
      // Check if we have cached data first
      const cachedTitle = getTitleDetail(titleId);
      if (cachedTitle && isFresh(`titleDetail:${titleId}`)) {
        setTitle(cachedTitle);
        setLoading(false);
      } else {
        loadTitle(titleId);
      }
      
      if (user) {
        checkIfFavorited(titleId);
      }
    }
  }, [titleId, user, getTitleDetail, isFresh]);

  const loadTitle = async (id: string) => {
    try {
      setLoading(true);
      const data = await titlesService.getTitleById(id);
      setTitle(data);
      // Cache the title data
      setTitleDetail(id, data);
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

  const formatGenre = (genre: string | string[]) => {
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
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
                <h1 className="text-4xl font-bold text-midnight-ink mb-2">
                  {title.title_name_en || title.title_name_kr}
                </h1>
                {title.title_name_kr && title.title_name_en && (
                  <p className="text-lg text-gray-500 font-medium mb-4">
                    {title.title_name_kr}
                  </p>
                )}
                
                {/* Story and Art Authors */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-4">
                  {title.story_author && (
                    <div>
                      <span className="font-semibold text-hanok-teal">Story by</span> <span className="text-gray-600">{title.story_author}</span>
                    </div>
                  )}
                  {title.art_author && (
                    <div>
                      <span className="font-semibold text-hanok-teal">Art by</span> <span className="text-gray-600">{title.art_author}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3 ml-6">
                {isAuthenticated && (
                  <Button
                    id="title-detail-favorite-toggle-btn"
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
                  id="title-detail-contact-creator-btn"
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
            <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 rounded-xl p-1 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group">
              {/* Animated border glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              
              <a 
                href={title.title_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-white rounded-lg p-4 text-center relative overflow-hidden group-hover:bg-gray-50 transition-colors duration-300"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/30 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                
                <div className="relative flex items-center justify-center gap-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-full">
                    <ExternalLink className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-gray-800 mb-1">View Original Content</div>
                    <div className="text-sm text-gray-600">Read the full story on original platform</div>
                  </div>
                </div>
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

          {/* Format Badge */}
          <div className="flex flex-wrap gap-2">
            {title.content_format && (
              <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-50 px-3 py-1">
                {formatContentFormat(title.content_format)}
              </Badge>
            )}
          </div>


          {/* Note Card - Only show if note exists */}
          {title.note && (
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-midnight-ink text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-hanok-teal" />
                  Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gradient-to-r from-hanok-teal/5 to-porcelain-blue-50 rounded-lg border-l-4 border-hanok-teal">
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
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
              <CardTitle className="text-midnight-ink text-xl">Synopsis</CardTitle>

            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {title.description ? (
                  <p className="text-gray-600 leading-relaxed text-base">{title.description}</p>
                ) : (
                  <p className="text-gray-500 italic text-sm">No description available for this title.</p>
                )}

                {/* Keywords Section */}
                <div className="pt-4 border-t border-gray-200">
                  <h5 className="font-bold text-hanok-teal mb-3">Keywords</h5>
                  <div className="flex flex-wrap gap-2">
                    {(title.keywords || title.tags) && (title.keywords || title.tags).length > 0 ? (
                      (title.keywords || title.tags).map((tag, idx) => (
                        <div key={`synopsis-keyword-${idx}`} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {tag}
                        </div>
                      ))
                    ) : (
                      <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                        No keywords available
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Premium Feature Notice */}
                {title.pitch && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-800">Premium Content Available</span>
                      </div>
                      {isAuthenticated && (
                        <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
                          <DialogTrigger id="title-detail-view-pitch-btn" asChild>
                            <Button id="title-detail-view-pitch-btn" className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-700 text-white shadow-xl border-0 rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden group">
                              {/* Shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                              
                              {/* Icons */}
                              <Crown className="h-3 w-3 mr-1 text-yellow-300 animate-pulse pointer-events-none" />
                              <FileText className="h-3 w-3 mr-1 pointer-events-none" />
                              
                              {/* Text */}
                              <span className="relative z-10 pointer-events-none">View Pitch</span>
                              
                              {/* Glow effect */}
                              <div className="absolute inset-0 rounded-full bg-purple-400/50 blur-md group-hover:bg-purple-300/60 transition-colors duration-300 pointer-events-none"></div>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl max-h-[90vh] p-0">
                            <DialogHeader className="p-6 pb-0">
                              <DialogTitle>
                                Pitch Document - {title.title_name_en || title.title_name_kr}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="p-6 pt-0">
                              <SecurePDFViewer 
                                pdfUrl={title.pitch}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {!isAuthenticated && (
                        <Button
                          id="title-detail-view-pitch-disabled-btn"
                          disabled
                          className="bg-gray-400 text-gray-600 shadow-lg border-0 rounded-full px-4 py-2 text-sm font-medium cursor-not-allowed relative"
                        >
                          <Crown className="h-3 w-3 mr-1 text-gray-500" />
                          <FileText className="h-3 w-3 mr-1" />
                          View Pitch
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">!</span>
                          </div>
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-purple-700">
                      Premium Content Available by request. Request a detailed pitch document with comprehensive information about the story, target audience, and market positioning.
                    </p>
                  </div>
                )}
                
                {!title.pitch && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-hanok-teal/10 to-blue-50 border border-hanok-teal/30 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-hanok-teal" />
                        <span className="font-semibold text-hanok-teal">Premium Content Available</span>
                      </div>
                      {isAuthenticated && (
                        <Button 
                          id="title-detail-request-pitch-btn"
                          onClick={() => {
                            setPremiumFeatureName("Request a pitch deck");
                            setPremiumPopupOpen(true);
                          }}
                          className="bg-gradient-to-r from-hanok-teal via-hanok-teal to-blue-600 hover:from-hanok-teal/90 hover:via-hanok-teal/90 hover:to-blue-700 text-white shadow-xl border-0 rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden group"
                        >
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                          
                          {/* Icons */}
                          <FileText className="h-3 w-3 mr-1 pointer-events-none" />
                          
                          {/* Text */}
                          <span className="relative z-10 pointer-events-none">Request Pitch</span>
                          
                          {/* Glow effect */}
                          <div className="absolute inset-0 rounded-full bg-hanok-teal/50 blur-md group-hover:bg-hanok-teal/60 transition-colors duration-300 pointer-events-none"></div>
                        </Button>
                      )}
                      {!isAuthenticated && (
                        <Button
                          id="title-detail-request-pitch-disabled-btn"
                          disabled
                          className="bg-gray-400 text-gray-600 shadow-lg border-0 rounded-full px-4 py-2 text-sm font-medium cursor-not-allowed relative"
                        >
                          <FileText className="h-3 w-3 mr-1 text-gray-500" />
                          Request Pitch
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">!</span>
                          </div>
                        </Button>
                      )}
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
                      <div className="flex items-center gap-2 mb-3">
                        <h5 className="font-bold text-hanok-teal">Perfect For</h5>
                        <span className="bg-rose-200/70 text-rose-800 text-[10px] px-2 py-1 rounded-full font-medium">
                          PRO PLAN
                        </span>
                      </div>
                      <PremiumColumn>
                        {title.perfect_for ? (
                          <div className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {title.perfect_for}
                          </div>
                        ) : (
                          <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                            Not specified
                          </div>
                        )}
                      </PremiumColumn>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h5 className="font-bold text-hanok-teal">Comps</h5>
                        <span className="bg-rose-200/70 text-rose-800 text-[10px] px-2 py-1 rounded-full font-medium">
                          PRO PLAN
                        </span>
                      </div>
                      <PremiumColumn>
                        {title.comps && title.comps.length > 0 ? (
                          <div className="space-y-1">
                            {title.comps.map((comp, index) => (
                              <div key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mr-1 mb-1">
                                {comp}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                            Not specified
                          </div>
                        )}
                      </PremiumColumn>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-bold text-hanok-teal mb-3">Tone</h5>
                      {title.tone ? (
                        <div className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          {title.tone}
                        </div>
                      ) : (
                        <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                          Not specified
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-hanok-teal mb-3">Genre</h5>
                      {title.genre && (Array.isArray(title.genre) ? title.genre.length > 0 : true) ? (
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(title.genre) ? (
                            title.genre.map((g, idx) => (
                              <div key={idx} className="inline-block bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-medium">
                                {formatGenre(g)}
                              </div>
                            ))
                          ) : (
                            <div className="inline-block bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-medium">
                              {formatGenre(title.genre)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                          Not specified
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Title Information and Details */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-midnight-ink text-xl">Title Information</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Statistics Section */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-midnight-ink text-sm uppercase tracking-wide mb-4">Statistics</h4>
                <div className="space-y-3">
                  {/* Views and Likes on same line */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs font-semibold text-hanok-teal">Views</p>
                        <p className="font-medium text-gray-600 text-sm">{formatViews(title.views || 0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                      <Heart className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs font-semibold text-hanok-teal">Likes</p>
                        <p className="font-medium text-gray-600 text-sm">{formatLikes(title.likes || 0)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating on separate line if exists */}
                  {title.rating && title.rating_count && title.rating_count > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-xs font-semibold text-hanok-teal">Rating</p>
                        <p className="font-medium text-gray-600 text-sm">{title.rating.toFixed(1)} ({title.rating_count} reviews)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Creator Information */}
                <div className="space-y-4">
                  {title.author && (
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1">Story Author (Original Author)</h5>
                      <p className="text-gray-600 text-sm">{title.author}</p>
                    </div>
                  )}
                  {title.writer && (
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1">Writer</h5>
                      <p className="text-gray-600 text-sm">{title.writer}</p>
                    </div>
                  )}
                  {title.illustrator && (
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1">Art Author (Artist)</h5>
                      <p className="text-gray-600 text-sm">{title.illustrator}</p>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h5 className="font-bold text-hanok-teal">Rights Owner</h5>
                      <span className="bg-rose-200/70 text-rose-800 text-[10px] px-2 py-1 rounded-full font-medium">
                        PRO PLAN
                      </span>
                    </div>
                    <PremiumColumn>
                      {(title.rights_owner || title.rights) ? (
                        <div className="inline-block bg-rose-100 text-rose-800 px-2 py-1 rounded-full text-xs font-medium">
                          {title.rights_owner || title.rights}
                        </div>
                      ) : (
                        <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                          Not specified
                        </div>
                      )}
                    </PremiumColumn>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h5 className="font-bold text-hanok-teal">Audience</h5>
                      <span className="bg-rose-200/70 text-rose-800 text-[10px] px-2 py-1 rounded-full font-medium">
                        PRO PLAN
                      </span>
                    </div>
                    <PremiumColumn>
                      {title.audience ? (
                        <div className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                          {title.audience}
                        </div>
                      ) : (
                        <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                          Not specified
                        </div>
                      )}
                    </PremiumColumn>
                  </div>
                </div>

                {/* Right Column - Content Details */}
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-hanok-teal mb-3">Series Status</h5>
                    <div className="inline-block bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-xs font-medium">
                      {title.completed !== null && title.completed !== undefined 
                        ? (title.completed ? 'Completed' : 'Ongoing') 
                        : 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-hanok-teal mb-1">Number of Chapters</h5>
                    <p className="text-gray-600 text-sm">
                      {title.chapters ? (
                        `${title.chapters.toLocaleString()}${title.completed !== 'completed' ? '+' : ''}`
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>




        </div>
      </div>
      
      {/* Premium Feature Popup */}
      <PremiumFeaturePopup
        isOpen={premiumPopupOpen}
        onClose={() => setPremiumPopupOpen(false)}
        featureName={premiumFeatureName}
        titleId={title?.title_id}
        titleName={title?.title_name_en || title?.title_name_kr}
        requestType={
          premiumFeatureName === "Request a pitch deck" ? "pitch" :
          premiumFeatureName === "Contact Creator" ? "contact" :
          undefined
        }
      />
      
    </div>
  );
}
