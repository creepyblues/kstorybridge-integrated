import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Eye, Heart, Star, ExternalLink, Crown, FileText, X, Lock } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, useToast } from "@kstorybridge/ui";
import { titlesService, type Title } from "@/services/titlesService";
import { favoritesService } from "@/services/favoritesService";

import { useAuth } from "@/hooks/useAuth";
import { useDataCache } from "@/contexts/DataCacheContext";
import SecurePDFViewer from "@/components/SecurePDFViewer";
import PremiumFeaturePopup from "@/components/PremiumFeaturePopup";
import PremiumColumn from "@/components/PremiumColumn";
import OptimizedTierGatedContent from "@/components/OptimizedTierGatedContent";
import { TierProvider } from "@/contexts/TierContext";
import { useTierAccess } from "@/hooks/useTierAccess";

function TitleDetailContent() {
  const { titleId } = useParams<{ titleId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, canAccessPremiumContent } = useTierAccess();
  
  // Debug logging for localhost
  useEffect(() => {
    console.log('🔍 TitleDetail - Tier access:', { tier, canAccessPremiumContent });
  }, [tier, canAccessPremiumContent]);
  
  // Check if we should bypass auth for localhost development
  const shouldBypassAuth = () => {
    const isLocalhost = window.location.hostname === 'localhost';
    const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
    const isDev = import.meta.env.DEV;
    return isLocalhost && (bypassEnabled || isDev);
  };

  // For localhost auth bypass, consider as authenticated
  const isAuthenticated = user || shouldBypassAuth();
  const { getTitleDetail, setTitleDetail, isFresh, refreshData } = useDataCache();
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>("");
  
  // Sample PDF URL from Supabase storage (properly encoded)
  const SAMPLE_PDF_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/images/Werewolves%20Going%20Crazy%20Over%20Me-Sample.pdf";
  
  // Ensure modal renders properly with slight delay
  useEffect(() => {
    if (isPdfModalOpen) {
      // Force re-render to ensure modal displays
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isPdfModalOpen]);
  
  
  const [premiumPopupOpen, setPremiumPopupOpen] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState("");
  
  // Debug premium popup state changes
  useEffect(() => {
    console.log('🚪 Premium popup state changed to:', premiumPopupOpen);
    console.log('📝 Premium feature name:', premiumFeatureName);
  }, [premiumPopupOpen, premiumFeatureName]);

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
  }, [titleId, user, getTitleDetail]); // Remove isFresh from dependencies

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
        
        // Invalidate favorites cache so Favorites page will refresh
        refreshData('favorites');
      } else {
        await favoritesService.addToFavorites(user.id, titleId);
        setIsFavorited(true);
        toast({ title: "Added to favorites" });
        
        // Invalidate favorites cache so Favorites page will refresh
        refreshData('favorites');
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
    return views.toLocaleString();
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
    <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        {/* Title Card */}
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl mb-6 sm:mb-8 lg:mb-12">
          <CardContent className="p-4 sm:p-6 lg:p-8 xl:p-10">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-2 sm:mb-3 leading-tight">
                  {title.title_name_en || title.title_name_kr}
                </h1>
                {title.title_name_kr && title.title_name_en && (
                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-500 font-medium mb-4 sm:mb-6">
                    {title.title_name_kr}
                  </p>
                )}
                
                {/* Story and Art Authors */}
                <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
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
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:ml-4 lg:ml-8">
                {isAuthenticated && (
                  <Button
                    id="title-detail-favorite-toggle-btn"
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    variant="outline"
                    className={`w-full sm:w-auto shadow-lg rounded-2xl px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-sm sm:text-base ${isFavorited 
                      ? "border-hanok-teal bg-hanok-teal/5 text-hanok-teal hover:bg-hanok-teal hover:text-white" 
                      : "border-gray-300 text-gray-600 hover:border-hanok-teal hover:text-hanok-teal hover:bg-hanok-teal/5"
                    }`}
                  >
                    <Heart className={`h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 ${isFavorited ? "fill-current" : ""}`} />
                    <span className="hidden sm:inline">{isFavorited ? "Remove from Favorites" : "Add to Favorites"}</span>
                    <span className="sm:hidden">{isFavorited ? "Remove" : "Add"}</span>
                  </Button>
                )}
                
                <Button 
                  id="title-detail-contact-creator-btn"
                  onClick={() => {
                    console.log('🔥 Contact Creator button clicked!');
                    console.log('📝 Setting premium feature name to: Contact Creator');
                    setPremiumFeatureName("Contact Creator");
                    console.log('🚪 Opening premium popup...');
                    setPremiumPopupOpen(true);
                    console.log('✅ Premium popup state set to true');
                  }}
                  variant="outline" 
                  className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 shadow-lg rounded-2xl px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">Contact Creator</span>
                  <span className="sm:hidden">Contact</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 xl:gap-12 mb-8 sm:mb-12 lg:mb-16">
        {/* Left Column - Cover Image and Title Info */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Cover Image */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              {title.title_image ? (
                <div className="w-full h-64 sm:h-80 lg:h-96 bg-gray-100 overflow-hidden">
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
            <div className="py-4 px-5 bg-hanok-teal/5 rounded-lg border-l-4 border-hanok-teal">
              <p className="text-gray-700 font-medium italic text-base leading-relaxed">
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
        <div className="lg:col-span-2 space-y-8">
          {/* Synopsis */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
              <CardTitle className="text-midnight-ink text-2xl font-bold">Synopsis</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <div className="space-y-8">
                {title.description ? (
                  <p className="text-gray-600 leading-relaxed text-base lg:text-lg">{title.description}</p>
                ) : (
                  <p className="text-gray-500 italic text-base">No description available for this title.</p>
                )}

                {/* Keywords Section */}
                <div className="pt-6 border-t border-gray-200">
                  <h5 className="font-bold text-hanok-teal mb-4 text-lg">Keywords</h5>
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
                        <>
                          <div className="flex items-center gap-2">
                            <Button 
                              id="title-detail-view-pitch-btn" 
                              className={canAccessPremiumContent 
                                ? "bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-700 text-white shadow-xl border-0 rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden group"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-md border border-gray-300 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 relative"}
                              onClick={() => {
                                console.log('🔍 View Pitch clicked:', { canAccessPremiumContent, tier });
                                if (canAccessPremiumContent) {
                                  console.log('📄 Opening PDF modal');
                                  setCurrentPdfUrl(title.pitch || "");
                                  // Small delay to ensure proper state update
                                  setTimeout(() => setIsPdfModalOpen(true), 10);
                                } else {
                                  console.log('⬆️ Showing upgrade modal');
                                  setShowUpgradeModal(true);
                                }
                              }}
                            >
                              {canAccessPremiumContent ? (
                                <>
                                  {/* Shine effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                                  
                                  {/* Icons */}
                                  <Crown className="h-3 w-3 mr-1 text-yellow-300 animate-pulse pointer-events-none" />
                                  <FileText className="h-3 w-3 mr-1 pointer-events-none" />
                                  
                                  {/* Text */}
                                  <span className="relative z-10 pointer-events-none">View Pitch</span>
                                  
                                  {/* Glow effect */}
                                  <div className="absolute inset-0 rounded-full bg-purple-400/50 blur-md group-hover:bg-purple-300/60 transition-colors duration-300 pointer-events-none"></div>
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 mr-1" />
                                  <span>View Pitch</span>
                                </>
                              )}
                            </Button>
                            
                            {/* Pro Plan Badge for basic/invited users */}
                            {!canAccessPremiumContent && (
                              <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 px-2 py-1 text-xs font-bold">
                                PRO PLAN
                              </Badge>
                            )}
                          </div>
                          
                          {/* Enhanced PDF Modal with Modern Design */}
                          {isPdfModalOpen && (
                            <div 
                              className="fixed inset-0 bg-gradient-to-br from-midnight-ink/80 via-midnight-ink/90 to-black/95 z-[9999] flex items-center justify-center p-4"
                              onClick={() => setIsPdfModalOpen(false)}
                              style={{ 
                                animation: 'fadeIn 0.3s ease-out',
                                backdropFilter: 'blur(8px)'
                              }}
                            >
                              <div 
                                className="bg-white rounded-2xl shadow-2xl border border-porcelain-blue/20 max-w-7xl w-full max-h-[95vh] relative overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                                style={{ 
                                  animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                  transform: 'translateY(0)',
                                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                                }}
                              >
                                {/* Enhanced Header with Gradient */}
                                <div className="relative bg-gradient-to-r from-hanok-teal to-hanok-teal/90 p-6 border-b border-hanok-teal/20">
                                  <div className="absolute inset-0 bg-gradient-to-r from-hanok-teal/10 to-transparent"></div>
                                  <div className="relative flex items-center justify-between">
                                    <div>
                                      <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                                        SAMPLE PITCH DECK
                                      </h2>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* PDF Content Container with Refined Styling */}
                                <div className="relative bg-gradient-to-b from-gray-50 to-white" style={{ height: 'calc(95vh - 80px)', width: '100%' }}>
                                  <div className="p-1 h-full w-full">
                                    <div className="bg-white rounded-xl shadow-inner border border-gray-100 overflow-hidden w-full h-full flex justify-center">
                                      <div style={{ 
                                        width: '75%',
                                        height: '100%',
                                        maxWidth: '1000px',
                                        minWidth: '600px'
                                      }}>
                                        <SecurePDFViewer 
                                          pdfUrl={currentPdfUrl}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Enhanced Close Button */}
                                <button
                                  onClick={() => setIsPdfModalOpen(false)}
                                  className="absolute top-6 right-6 group bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-xl p-3 transition-all duration-300 z-10"
                                  aria-label="Close modal"
                                >
                                  <X className="h-5 w-5 text-white group-hover:text-white transition-colors duration-200" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
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
                            console.log('🔥 Request Pitch button clicked!');
                            console.log('📝 Setting premium feature name to: Request a pitch deck');
                            setPremiumFeatureName("Request a pitch deck");
                            console.log('🚪 Opening premium popup...');
                            setPremiumPopupOpen(true);
                            console.log('✅ Premium popup state set to true');
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
                <div className="pt-8 border-t border-gray-200 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="mb-4">
                        <h5 className="font-bold text-hanok-teal text-lg">Perfect For</h5>
                      </div>
                      <OptimizedTierGatedContent requiredTier="basic">
                        {title.perfect_for ? (
                          <div className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium truncate max-w-[200px]" title={title.perfect_for}>
                            {title.perfect_for}
                          </div>
                        ) : (
                          <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                            Not specified
                          </div>
                        )}
                      </OptimizedTierGatedContent>
                    </div>
                    <div>
                      <div className="mb-4">
                        <h5 className="font-bold text-hanok-teal text-lg">Comps</h5>
                      </div>
                      <OptimizedTierGatedContent requiredTier="basic">
                        {title.comps && title.comps.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {title.comps.map((comp, index) => (
                              <div key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium truncate max-w-[200px]" title={comp}>
                                {comp}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                            Not specified
                          </div>
                        )}
                      </OptimizedTierGatedContent>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h5 className="font-bold text-hanok-teal mb-4 text-lg">Tone</h5>
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
                      <h5 className="font-bold text-hanok-teal mb-4 text-lg">Genre</h5>
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
            <CardHeader className="pb-6">
              <CardTitle className="text-midnight-ink text-2xl font-bold">Title Information</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column - Creator Information */}
                <div className="space-y-6">
                  {/* Views */}
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-2 text-base">Views</h5>
                    <p className="text-gray-600 text-base">{formatViews(title.views || 0)}</p>
                  </div>
                  
                  {/* Series Status */}
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-2 text-base">Series Status</h5>
                    <p className="text-gray-600 text-base">
                      {title.completed !== null && title.completed !== undefined 
                        ? (title.completed ? 'Completed' : 'Ongoing') 
                        : 'Unknown'}
                    </p>
                  </div>
                  
                  {/* Rating */}
                  {title.rating && title.rating_count && title.rating_count > 0 && (
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-2 text-base">Rating</h5>
                      <p className="text-gray-600 text-base">{title.rating.toFixed(1)} ({title.rating_count} reviews)</p>
                    </div>
                  )}
                  
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
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-semibold text-hanok-teal text-base">Rights Owner</h5>
                      <span className="bg-gray-200 text-gray-600 text-[7px] px-1.5 py-0.5 rounded-full font-medium">
                        PRO PLAN
                      </span>
                    </div>
                    <OptimizedTierGatedContent requiredTier="pro">
                      {(title.rights_owner || title.rights) ? (
                        <div className="inline-block bg-rose-100 text-rose-800 px-2 py-1 rounded-full text-xs font-medium truncate max-w-[200px]" title={title.rights_owner || title.rights}>
                          {title.rights_owner || title.rights}
                        </div>
                      ) : (
                        <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                          Not specified
                        </div>
                      )}
                    </OptimizedTierGatedContent>
                  </div>
                </div>

                {/* Right Column - Content Details */}
                <div className="space-y-6">
                  {/* Likes */}
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-2 text-base">Likes</h5>
                    <p className="text-gray-600 text-base">{formatLikes(title.likes || 0)}</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-2 text-base">Number of Chapters</h5>
                    <p className="text-gray-600 text-base">
                      {title.chapters ? (
                        `${title.chapters.toLocaleString()}${title.completed !== 'completed' ? '+' : ''}`
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>
                  
                  {/* Audience */}
                  <div>
                    <div className="mb-2">
                      <h5 className="font-semibold text-hanok-teal text-base">Audience</h5>
                    </div>
                    <OptimizedTierGatedContent requiredTier="basic">
                      {title.audience ? (
                        <div className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium truncate max-w-[200px]" title={title.audience}>
                          {title.audience}
                        </div>
                      ) : (
                        <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                          Not specified
                        </div>
                      )}
                    </OptimizedTierGatedContent>
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
      
      {/* Upgrade Modal for View Pitch */}
      {showUpgradeModal === true && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-[400px] w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full">
                <Crown className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center text-midnight-ink mb-4">
              Premium Feature
            </h2>
            <p className="text-center text-base text-gray-600 mb-6">
              Pitch Deck is a premium feature and available only to Pro or Suite Plan users
            </p>
            <div className="space-y-3">
              <Button
                className="w-full bg-white hover:bg-gray-50 text-hanok-teal border-2 border-hanok-teal font-semibold py-3"
                onClick={() => {
                  console.log('View Sample Pitch clicked from upgrade modal');
                  setCurrentPdfUrl(SAMPLE_PDF_URL);
                  setShowUpgradeModal(false);
                  setTimeout(() => setIsPdfModalOpen(true), 10);
                }}
              >
                View Sample Pitch
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3"
                onClick={() => {
                  console.log('Upgrade button clicked, navigating to pricing');
                  setShowUpgradeModal(false);
                  navigate('/buyers/pricing');
                }}
              >
                Upgrade Your Plan
              </Button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default function TitleDetail() {
  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <TierProvider>
        <TitleDetailContent />
      </TierProvider>
    </>
  );
}
