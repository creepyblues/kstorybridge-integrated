import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Eye, Heart, Star, ExternalLink, Crown, FileText, X, Lock, Building2, Users, Target, TrendingUp, Calendar, BookOpen } from "lucide-react";
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

function TitleDetailNewContent() {
  const { titleId } = useParams<{ titleId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, canAccessPremiumContent } = useTierAccess();
  
  const isAuthenticated = !!user;
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
  
  const [premiumPopupOpen, setPremiumPopupOpen] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState("");

  useEffect(() => {
    if (titleId) {
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
  }, [titleId, user, getTitleDetail]);

  const loadTitle = async (id: string) => {
    try {
      setLoading(true);
      const data = await titlesService.getTitleById(id);
      setTitle(data);
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
        refreshData('favorites');
      } else {
        await favoritesService.addToFavorites(user.id, titleId);
        setIsFavorited(true);
        toast({ title: "Added to favorites" });
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

  const formatViews = (views: number) => {
    if (!views) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toLocaleString();
  };

  const formatContentFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
      </div>
    );
  }

  if (!title) {
    return (
      <div className="text-center text-gray-600 py-16">
        <h2 className="text-xl font-medium mb-2">Title not found</h2>
        <p className="text-sm">The requested title could not be found.</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Hero Section - Full Width */}
      <div>
        <div className="max-w-6xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              {/* Mobile: Full width image first */}
              <div className="sm:hidden mb-4">
                <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden shadow-xl ring-1 ring-slate-200">
                  {title.title_image ? (
                    <img 
                      src={title.title_image} 
                      alt={title.title_name_en || title.title_name_kr}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-hanok-teal/10 to-hanok-teal/20 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-hanok-teal" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Desktop: Side-by-side layout */}
              <div className="hidden sm:flex sm:items-start gap-4 sm:gap-6 mb-4">
                <div className="w-32 h-44 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-xl ring-1 ring-slate-200">
                  {title.title_image ? (
                    <img 
                      src={title.title_image} 
                      alt={title.title_name_en || title.title_name_kr}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-hanok-teal/10 to-hanok-teal/20 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-hanok-teal" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 mb-2 sm:mb-3 leading-tight">
                    {title.title_name_en || title.title_name_kr}
                  </h1>
                  {title.title_name_kr && title.title_name_en && (
                    <p className="text-lg sm:text-xl text-slate-600 font-medium mb-3 sm:mb-4">
                      {title.title_name_kr}
                    </p>
                  )}
                  
                  {/* Author info - Story and Art on same line */}
                  <div className="flex flex-row flex-wrap gap-4 sm:gap-6 text-sm sm:text-base text-slate-600 justify-center sm:justify-start">
                    {title.story_author && (
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-hanok-teal">Story:</span> 
                        <span className="font-medium">{title.story_author}</span>
                      </span>
                    )}
                    {title.art_author && (
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-hanok-teal">Art:</span> 
                        <span className="font-medium">{title.art_author}</span>
                      </span>
                    )}
                  </div>

                  {/* Quick stats - views/chapters/status in one line */}
                  <div className="flex flex-row items-center gap-3 sm:gap-6 mt-3 sm:mt-4 text-xs sm:text-sm text-slate-500 justify-center sm:justify-start flex-wrap">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-medium">{formatViews(title.views || 0)} views</span>
                    </div>
                    {title.chapters && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="font-medium">{title.chapters.toLocaleString()} chapters</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-medium">{title.completed ? 'Completed' : 'Ongoing'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile: Content section */}
              <div className="sm:hidden">
                <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-tight text-center">
                  {title.title_name_en || title.title_name_kr}
                </h1>
                {title.title_name_kr && title.title_name_en && (
                  <p className="text-lg text-slate-600 font-medium mb-3 text-center">
                    {title.title_name_kr}
                  </p>
                )}
                
                {/* Author info - Story and Art on same line */}
                <div className="flex flex-row flex-wrap gap-4 text-sm text-slate-600 justify-center">
                  {title.story_author && (
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-hanok-teal">Story:</span> 
                      <span className="font-medium">{title.story_author}</span>
                    </span>
                  )}
                  {title.art_author && (
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-hanok-teal">Art:</span> 
                      <span className="font-medium">{title.art_author}</span>
                    </span>
                  )}
                </div>

                {/* Quick stats - views/chapters/status in one line */}
                <div className="flex flex-row items-center gap-3 mt-3 text-xs text-slate-500 justify-center flex-wrap">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3" />
                    <span className="font-medium">{formatViews(title.views || 0)} views</span>
                  </div>
                  {title.chapters && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3 w-3" />
                      <span className="font-medium">{title.chapters.toLocaleString()} chapters</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium">{title.completed ? 'Completed' : 'Ongoing'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons - Evenly distributed and balanced */}
            <div className="flex flex-row gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end">
                {isAuthenticated && (
                  <Button
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    variant="outline"
                    className={`flex-1 px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-200 ${isFavorited 
                      ? "border-hanok-teal text-hanok-teal bg-hanok-teal/5 hover:bg-hanok-teal/10" 
                      : "border-purple-500 text-slate-600 hover:border-purple-600 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    <Heart className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isFavorited ? "fill-current" : ""}`} />
                    {isFavorited ? "Saved" : "Save"}
                  </Button>
                )}
                
                {title.title_url && (
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 border-purple-500 text-slate-600 hover:bg-purple-50 hover:border-purple-600 px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <a href={title.title_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      View Original
                    </a>
                  </Button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4">

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Left Column - Business Critical Info (2/5) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          
          {/* Key Business Info Panel */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
              
                {/* Rights Owner */}
                <div>
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Rights Owner</h5>
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {title.rights_owner || title.rights || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={() => {
                        setPremiumFeatureName("Contact Creator");
                        setPremiumPopupOpen(true);
                      }}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                    >
                      Contact
                    </Button>
                  </div>
                </div>

                {/* Target Market Info */}
              <div className="space-y-4">
                {/* Perfect For */}
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-slate-700">Perfect For</h5>
                  <OptimizedTierGatedContent requiredTier="basic">
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {title.perfect_for || "Not specified"}
                    </span>
                  </OptimizedTierGatedContent>
                </div>

                {/* Audience */}
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-slate-700">Audience</h5>
                  <OptimizedTierGatedContent requiredTier="basic">
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {title.audience || "Not specified"}
                    </span>
                  </OptimizedTierGatedContent>
                </div>

                {/* Comps */}
                {title.comps && title.comps.length > 0 && (
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Comps</h5>
                    <OptimizedTierGatedContent requiredTier="basic">
                      <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                        {title.comps.slice(0, 2).map(comp => 
                          comp.length > 12 ? comp.substring(0, 12) + '...' : comp
                        ).join(', ')}
                        {title.comps.length > 2 && ` +${title.comps.length - 2}`}
                      </span>
                    </OptimizedTierGatedContent>
                  </div>
                )}
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Format & Genre */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900">Content Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-slate-700">Format</h5>
                  {title.content_format && (
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {formatContentFormat(title.content_format)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-slate-700">Series Status</h5>
                  <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                    {title.completed ? 'Completed' : 'Ongoing'}
                  </span>
                </div>

                {title.genre && (
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Genre</h5>
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {Array.isArray(title.genre) 
                        ? title.genre.slice(0, 2).map(g => g.replace('_', ' ')).join(', ')
                        : title.genre.replace('_', ' ')
                      }
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column - Content Overview (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Synopsis - Compact with expand option */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900">Synopsis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {title.synopsis ? (
                  <p className="text-slate-700 leading-relaxed">
                    {title.synopsis}
                  </p>
                ) : (
                  <p className="text-slate-500 italic">No synopsis available for this title.</p>
                )}

                {/* Tagline */}
                {title.tagline && (
                  <div className="mt-4 p-4 bg-hanok-teal/5 border-l-4 border-hanok-teal rounded-r-lg">
                    <p className="text-slate-700 font-medium italic">
                      "{title.tagline}"
                    </p>
                  </div>
                )}

                {/* Pitch Deck */}
                <div className="pt-4">
                  <h5 className="font-bold text-slate-700 mb-3">Pitch Deck</h5>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <span className="text-slate-600 text-sm sm:text-base text-center sm:text-left">View the Pitch Deck</span>
                    <Button
                      onClick={() => {
                        if (canAccessPremiumContent) {
                          setCurrentPdfUrl(title.pitch || "");
                          setTimeout(() => setIsPdfModalOpen(true), 10);
                        } else {
                          setShowUpgradeModal(true);
                        }
                      }}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-medium px-4 py-1.5 sm:px-3 sm:py-1 rounded-full shadow-sm hover:from-purple-600 hover:to-purple-700 transition-all duration-200 w-full sm:w-auto"
                    >
                      View
                    </Button>
                  </div>
                </div>

                {/* Keywords */}
                {(title.keywords || title.tags) && (title.keywords || title.tags).length > 0 && (
                  <div className="pt-4">
                    <h5 className="font-bold text-slate-700 mb-3">Keywords</h5>
                    <div className="flex flex-wrap gap-2">
                      {(title.keywords || title.tags).map((tag, idx) => (
                        <Badge key={idx} className="bg-slate-50 text-slate-600 border border-slate-200 font-medium px-2.5 py-1 rounded-md text-xs hover:bg-slate-100 transition-colors">
                          {tag.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          {title.note && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-hanok-teal" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {title.note}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Extended Author Information */}
          {(title.author || title.writer || title.illustrator) && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900">Creator Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {title.author && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                      <span className="text-sm font-medium text-slate-600">Original Author</span>
                      <span className="text-sm text-slate-900">{title.author}</span>
                    </div>
                  )}
                  {title.writer && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                      <span className="text-sm font-medium text-slate-600">Writer</span>
                      <span className="text-sm text-slate-900">{title.writer}</span>
                    </div>
                  )}
                  {title.illustrator && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                      <span className="text-sm font-medium text-slate-600">Illustrator</span>
                      <span className="text-sm text-slate-900">{title.illustrator}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* PDF Modal */}
      {isPdfModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setIsPdfModalOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-hanok-teal p-4 text-white flex items-center justify-between">
              <h2 className="text-xl font-semibold">Pitch Document</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPdfModalOpen(false)}
                className="text-white hover:bg-white/20 p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div style={{ height: 'calc(90vh - 72px)' }}>
              <SecurePDFViewer pdfUrl={currentPdfUrl} />
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Premium Feature</h2>
              <p className="text-slate-600 mb-6">
                Upgrade to Pro or Suite plan to access premium content.
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white"
                  onClick={() => {
                    setCurrentPdfUrl(SAMPLE_PDF_URL);
                    setShowUpgradeModal(false);
                    setTimeout(() => setIsPdfModalOpen(true), 10);
                  }}
                >
                  View Sample
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    navigate('/buyers/pricing');
                  }}
                >
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

export default function TitleDetailNew() {
  return (
    <TierProvider>
      <TitleDetailNewContent />
    </TierProvider>
  );
}