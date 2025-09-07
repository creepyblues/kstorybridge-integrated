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
import TestNewDesignLink from "@/components/TestNewDesignLink";

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
  const [synopsisExpanded, setSynopsisExpanded] = useState<boolean>(false);
  
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

  const truncatedSynopsis = title.synopsis && title.synopsis.length > 200 
    ? title.synopsis.substring(0, 200) + "..." 
    : title.synopsis;

  return (
    <div className="space-y-6">
      {/* Hero Section - Full Width */}
      <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-6 mb-4">
                {/* Cover Image - Larger for full-width hero */}
                <div className="w-24 h-32 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                  {title.title_image ? (
                    <img 
                      src={title.title_image} 
                      alt={title.title_name_en || title.title_name_kr}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-hanok-teal/10 to-hanok-teal/20 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-hanok-teal" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-3 leading-tight">
                    {title.title_name_en || title.title_name_kr}
                  </h1>
                  {title.title_name_kr && title.title_name_en && (
                    <p className="text-xl text-slate-600 font-medium mb-4">
                      {title.title_name_kr}
                    </p>
                  )}
                  
                  {/* Author info - enhanced for hero */}
                  <div className="flex flex-wrap gap-6 text-base text-slate-600">
                    {title.story_author && (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-hanok-teal rounded-full"></span>
                        <span className="font-semibold text-hanok-teal">Story:</span> 
                        <span className="font-medium">{title.story_author}</span>
                      </span>
                    )}
                    {title.art_author && (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-hanok-teal rounded-full"></span>
                        <span className="font-semibold text-hanok-teal">Art:</span> 
                        <span className="font-medium">{title.art_author}</span>
                      </span>
                    )}
                  </div>

                  {/* Quick stats in hero */}
                  <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="font-medium">{formatViews(title.views || 0)} views</span>
                    </div>
                    {title.chapters && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-medium">{title.chapters.toLocaleString()} chapters</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{title.completed ? 'Completed' : 'Ongoing'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons - Enhanced for hero */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
              <Button
                onClick={() => {
                  setPremiumFeatureName("Contact Creator");
                  setPremiumPopupOpen(true);
                }}
                className="bg-hanok-teal hover:bg-hanok-teal/90 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Building2 className="h-5 w-5 mr-2" />
                Contact Creator
              </Button>
              
              <div className="flex gap-3">
                {isAuthenticated && (
                  <Button
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    variant="outline"
                    className={`px-5 py-3 shadow-md hover:shadow-lg transition-all duration-200 ${isFavorited 
                      ? "border-hanok-teal text-hanok-teal bg-hanok-teal/5 hover:bg-hanok-teal/10" 
                      : "border-slate-300 text-slate-600 hover:border-hanok-teal hover:text-hanok-teal hover:bg-hanok-teal/5"
                    }`}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isFavorited ? "fill-current" : ""}`} />
                    {isFavorited ? "Saved" : "Save"}
                  </Button>
                )}
                
                {title.title_url && (
                  <Button
                    asChild
                    variant="outline"
                    className="border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 px-5 py-3 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <a href={title.title_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-4">

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Business Critical Info (2/5) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Key Business Info Panel */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-hanok-teal" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Rights Owner - Most Important */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Rights Owner
                  </h3>
                  <Badge className="bg-purple-100 text-purple-800 text-xs">PRO PLAN</Badge>
                </div>
                <OptimizedTierGatedContent requiredTier="pro">
                  <p className="text-emerald-800 font-medium">
                    {title.rights_owner || title.rights || "Not specified"}
                  </p>
                </OptimizedTierGatedContent>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Eye className="h-4 w-4 text-slate-600" />
                    <span className="text-xs font-medium text-slate-600">VIEWS</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">{formatViews(title.views || 0)}</div>
                </div>
                
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BookOpen className="h-4 w-4 text-slate-600" />
                    <span className="text-xs font-medium text-slate-600">CHAPTERS</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {title.chapters ? `${title.chapters.toLocaleString()}${!title.completed ? '+' : ''}` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Target Market Info */}
              <div className="space-y-3">
                {/* Perfect For */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-hanok-teal" />
                    Perfect For
                  </h4>
                  <OptimizedTierGatedContent requiredTier="basic">
                    <Badge variant="outline" className="border-hanok-teal text-hanok-teal bg-hanok-teal/5">
                      {title.perfect_for || "Not specified"}
                    </Badge>
                  </OptimizedTierGatedContent>
                </div>

                {/* Audience */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-hanok-teal" />
                    Target Audience
                  </h4>
                  <OptimizedTierGatedContent requiredTier="basic">
                    <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
                      {title.audience || "Not specified"}
                    </Badge>
                  </OptimizedTierGatedContent>
                </div>

                {/* Comps */}
                {title.comps && title.comps.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-hanok-teal" />
                      Similar Titles
                    </h4>
                    <OptimizedTierGatedContent requiredTier="basic">
                      <div className="flex flex-wrap gap-1">
                        {title.comps.slice(0, 3).map((comp, index) => (
                          <Badge key={index} variant="outline" className="border-slate-300 text-slate-700 text-xs">
                            {comp}
                          </Badge>
                        ))}
                        {title.comps.length > 3 && (
                          <Badge variant="outline" className="border-slate-300 text-slate-500 text-xs">
                            +{title.comps.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </OptimizedTierGatedContent>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Format & Genre */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Format</span>
                  {title.content_format && (
                    <Badge className="bg-slate-100 text-slate-700">
                      {formatContentFormat(title.content_format)}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Status</span>
                  <Badge className={`${title.completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {title.completed ? 'Completed' : 'Ongoing'}
                  </Badge>
                </div>

                {title.genre && (
                  <div>
                    <span className="text-sm font-medium text-slate-600 mb-2 block">Genre</span>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(title.genre) ? (
                        title.genre.slice(0, 3).map((g, idx) => (
                          <Badge key={idx} variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 text-xs">
                            {g.replace('_', ' ')}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 text-xs">
                          {title.genre.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Premium Content Access */}
          {(title.pitch || !title.pitch) && (
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-900">Premium Content</span>
                  </div>
                </div>
                
                {title.pitch ? (
                  <div className="space-y-3">
                    <p className="text-sm text-purple-700">Detailed pitch deck available</p>
                    <Button 
                      onClick={() => {
                        if (canAccessPremiumContent) {
                          setCurrentPdfUrl(title.pitch || "");
                          setTimeout(() => setIsPdfModalOpen(true), 10);
                        } else {
                          setShowUpgradeModal(true);
                        }
                      }}
                      className={`w-full ${canAccessPremiumContent 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : 'bg-white hover:bg-gray-50 text-purple-600 border-2 border-purple-200'
                      }`}
                    >
                      {canAccessPremiumContent ? (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          View Pitch Deck
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Upgrade to View
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-purple-700">Request detailed pitch document</p>
                    <Button 
                      onClick={() => {
                        setPremiumFeatureName("Request a pitch deck");
                        setPremiumPopupOpen(true);
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Request Pitch
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
                  <div>
                    <p className="text-slate-700 leading-relaxed">
                      {synopsisExpanded ? title.synopsis : truncatedSynopsis}
                    </p>
                    {title.synopsis.length > 200 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                        className="mt-2 text-hanok-teal hover:text-hanok-teal/80 p-0 h-auto font-normal"
                      >
                        {synopsisExpanded ? "Show Less" : "Read More"}
                      </Button>
                    )}
                  </div>
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

                {/* Keywords */}
                {(title.keywords || title.tags) && (title.keywords || title.tags).length > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <h5 className="font-medium text-slate-700 mb-3">Keywords</h5>
                    <div className="flex flex-wrap gap-2">
                      {(title.keywords || title.tags).slice(0, 8).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="border-slate-300 text-slate-600 text-xs">
                          {tag}
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

      <TestNewDesignLink />
      
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