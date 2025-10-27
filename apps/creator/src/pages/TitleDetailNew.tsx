import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import { Eye, Heart, Star, ExternalLink, Crown, FileText, X, Lock, Building2, Users, Target, TrendingUp, Calendar, BookOpen } from "lucide-react";
import { Button, Badge, Card, CardContent, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@kstorybridge/ui";
import { useToast } from "@/hooks/use-toast";
import { Stack } from '@/components/design-system';
import { PageContainer } from '@/components/layout/PageContainer';
import { titlesService, type Title } from "@/services/titlesService";
import { type PitchAnalysis } from "@/types/pitchAnalysis";

import { useAuth } from "@/hooks/useAuth";
import { useSessionCache } from "@/hooks/useSessionCache";
import { useDataCache } from "@/contexts/DataCacheContext";
import SecurePDFViewer from "@/components/SecurePDFViewer";
import { directApiService } from "@/services/directApiService";
import PremiumFeaturePopup from "@/components/PremiumFeaturePopup";
import PitchDeckThumbnail from "@/components/PitchDeckThumbnail";
import PremiumColumn from "@/components/PremiumColumn";
import OptimizedTierGatedContent from "@/components/OptimizedTierGatedContent";
import { TierProvider } from "@/contexts/TierContext";
import { useTierAccess } from "@/hooks/useTierAccess";
import { ContactUpgradePrompt, PremiumContentUpgradePrompt } from "@/components/UpgradePrompt";
import { triggerContactAttemptEmail, triggerPremiumContentEmail, triggerFirstSaveEmail } from "@/services/emailService";
import { trackSavedTitle, trackPitchView, trackContactCreatorClick, trackUpgradeButtonClick, trackPremiumFeatureAccess, trackTierUpgrade } from "@/utils/analytics";

function TitleDetailNewContent() {
  const { titleId } = useParams<{ titleId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, canAccessPremiumContent } = useTierAccess();
  
  const isAuthenticated = !!user;
  const {
    getTitleDetail,
    setTitleDetail,
    isFresh,
    isSessionValid,
    getDbConnectivityStatus,
    setDbConnectivityStatus,
    refreshData
  } = useDataCache();
  const { } = useSessionCache(); // Initialize session cache management
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>("");
  
  const [premiumPopupOpen, setPremiumPopupOpen] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState("");
  const [pitchAnalysis, setPitchAnalysis] = useState<PitchAnalysis | null>(null);

  useEffect(() => {
    if (titleId) {
      const cachedTitle = getTitleDetail(titleId);
      // NEW POLICY: Check session validity and cache freshness
      if (cachedTitle && isSessionValid() && isFresh(`titleDetail:${titleId}`)) {
        setTitle(cachedTitle);
        // Extract pitch_analysis from cached data
        if ((cachedTitle as any).pitch_analysis) {
          setPitchAnalysis((cachedTitle as any).pitch_analysis);
        }
        setLoading(false);
      } else {
        loadTitle(titleId);
      }

      if (user) {
        checkIfFavorited(titleId);
      }
    }
  }, [titleId, user, isSessionValid]); // Include session validity

  const loadTitle = async (id: string) => {
    try {
      setLoading(true);
      setDbError(null);

      console.log('📖 Loading title detail from database (session-based policy)...', id);

      // Use directApiService for consistent API calls
      const data = await directApiService.getTitleById(id);
      setTitle(data);
      setTitleDetail(id, data);
      setDbConnectivityStatus({ isConnected: true });

      // Extract pitch_analysis if available
      if ((data as any).pitch_analysis) {
        setPitchAnalysis((data as any).pitch_analysis);
        console.log('📊 Pitch analysis data loaded');
        console.log('🔍 FULL PITCH ANALYSIS OBJECT:', JSON.stringify((data as any).pitch_analysis, null, 2));
      }

      console.log('✅ Successfully loaded title detail from database');
    } catch (error) {
      console.error('❌ Database connectivity error loading title detail:', error);

      // Update connectivity status
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      setDbConnectivityStatus({ isConnected: false, error: errorMessage });
      setDbError(errorMessage);

      // NEW POLICY: Show database error to user instead of fallback
      toast({
        title: "Database Connection Error",
        description: "Unable to load title details. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorited = async (titleId: string) => {
    if (!user) return;

    try {
      const favorited = await directApiService.isTitleFavorited(user.id, titleId);
      setIsFavorited(favorited);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user || !titleId) {
      console.error("❌ No user or titleId available for favorites toggle");
      toast({
        title: "Authentication Error",
        description: "Please sign in to save titles.",
        variant: "destructive"
      });
      return;
    }

    // Prevent rapid clicking while already processing
    if (favoriteLoading) {
      console.log('⏳ TITLE DETAIL NEW: Favorites toggle already in progress, ignoring click');
      return;
    }

    console.log('❤️ TITLE DETAIL NEW: Toggling favorite:', {
      userId: user.id,
      titleId,
      currentlyFavorited: isFavorited
    });

    try {
      setFavoriteLoading(true);

      if (isFavorited) {
        console.log('🗑️ TITLE DETAIL NEW: Removing from favorites...');
        await directApiService.removeFromFavorites(user.id, titleId);
        setIsFavorited(false);
        toast({
          title: "Removed from saved titles",
          description: "This title has been removed from your saved titles"
        });
        refreshData('favorites');

        // PRD 2.1: Track unsave action
        if (title) {
          trackSavedTitle(titleId, title.title_name_en || title.title_name_kr || 'Unknown Title', 'detail', user.id);
        }

        console.log('✅ TITLE DETAIL NEW: Successfully removed from favorites');
      } else {
        console.log('❤️ TITLE DETAIL NEW: Adding to favorites...');
        await directApiService.addToFavorites(user.id, titleId);
        setIsFavorited(true);
        toast({
          title: "Added to saved titles",
          description: "You can find this title in your saved titles"
        });
        refreshData('favorites');

        // PRD 2.1: Track save action
        if (title) {
          trackSavedTitle(titleId, title.title_name_en || title.title_name_kr || 'Unknown Title', 'detail', user.id);
        }

        // PRD 2.1: Trigger first save email for new users
        try {
          const userName = user.user_metadata?.full_name || user.email || 'User';
          await triggerFirstSaveEmail(user.id, user.email, userName);
        } catch (error) {
          console.warn('Failed to trigger first save email:', error);
          // Don't fail the save operation if email fails
        }

        console.log('✅ TITLE DETAIL NEW: Successfully added to favorites');
      }
    } catch (error) {
      console.error("❌ TITLE DETAIL NEW: Error toggling favorite:", error);

      // Revert the UI state since the operation failed
      // (UI was already updated optimistically)

      let errorMessage = "Failed to update saved titles. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('unauthorized') || error.message.includes('403')) {
          errorMessage = "You don't have permission to save titles. Please sign in again.";
        }
      }

      toast({
        title: "Error updating saved titles",
        description: errorMessage,
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

  // NEW POLICY: Show database connectivity error if connection failed
  if (dbError && !getDbConnectivityStatus().isConnected) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="border-red-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl font-bold">!</span>
            </div>
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Database Connection Error
            </h3>
            <p className="text-red-500 mb-4">
              Unable to load title details. Please check your internet connection.
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
    <PageContainer>
      <div className="space-y-6">
        {/* Hero Section - Full Width */}
        <div>
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
                  <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-slate-900 mb-2 sm:mb-3 leading-tight">
                    {title.title_name_en || title.title_name_kr}
                  </h2>
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
                <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight text-center">
                  {title.title_name_en || title.title_name_kr}
                </h2>
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
                    className="flex-1 border-gray-300 hover:bg-gray-100 px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base transition-colors"
                  >
                    <Heart className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isFavorited ? "fill-current" : ""}`} />
                    {isFavorited ? "Saved" : "Save"}
                  </Button>
                )}
                
                {title.title_url && (
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 border-gray-300 hover:bg-gray-100 px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base transition-colors"
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

      {/* Horizontal divider with padding */}
      <div className="py-4 sm:py-5 lg:py-6">
        <hr className="border-gray-50" />
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column - Business Critical Info */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* Key Business Info Panel */}
          <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
            <Stack gap="sm">
              <h3 className="text-xl font-semibold text-slate-900">
                Business Information
              </h3>
              <div className="space-y-4">
              
                {/* Rights Holder */}
                <div>
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Rights Holder</h5>
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {title.rights_owner || title.rights || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={async () => {
                        // PRD 2.1: Track contact creator click
                        if (title) {
                          trackContactCreatorClick(
                            titleId,
                            title.title_name_en || title.title_name_kr || 'Unknown Title',
                            tier,
                            'detail'
                          );
                        }

                        // PRD 2.1: Trigger conversion email for basic users trying to contact
                        if (tier === 'basic' && user?.email && user?.user_metadata?.full_name) {
                          try {
                            await triggerContactAttemptEmail(
                              user.id,
                              user.email,
                              user.user_metadata.full_name,
                              tier
                            );
                          } catch (error) {
                            console.warn('Failed to trigger contact attempt email:', error);
                          }
                        }

                        setPremiumFeatureName("Contact Creator");
                        setPremiumPopupOpen(true);
                      }}
                      className="bg-pro-purple hover:bg-pro-purple-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors"
                    >
                      Contact
                    </Button>
                  </div>
                </div>

                {/* PRD 2.1: Contact upgrade prompt for basic users */}
                <div className="pt-4">
                  <ContactUpgradePrompt
                    variant="callout"
                    size="sm"
                    titleName={title.title_name_en || title.title_name_kr}
                    dismissible={true}
                  />
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
                  <div className="grid grid-cols-2 gap-4">
                    <h5 className="font-medium text-slate-700">Comps</h5>
                    <OptimizedTierGatedContent requiredTier="basic">
                      <div className="font-bold text-[#4C9C9B] uppercase text-xs text-right break-words">
                        {title.comps.join(', ')}
                      </div>
                    </OptimizedTierGatedContent>
                  </div>
                )}
              </div>
              </div>
            </Stack>
          </div>

          {/* Format & Genre */}
          <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
            <Stack gap="sm">
              <h3 className="text-xl font-semibold text-slate-900">Content Details</h3>
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
            </Stack>
          </div>

          {/* Keywords Card */}
          {(title.keywords || title.tags) && (title.keywords || title.tags).length > 0 && (
            <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
              <Stack gap="sm">
                <h3 className="text-xl font-semibold text-slate-900">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {(title.keywords || title.tags).map((tag, idx) => (
                    <Badge key={idx} className="bg-slate-50 text-slate-600 border border-slate-200 font-medium px-2.5 py-1 rounded-full text-xs hover:bg-slate-100 transition-colors">
                      {tag.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </Stack>
            </div>
          )}

        </div>

        {/* Right Column - Content Overview */}
        <div className="space-y-6">

          {/* Pitch Deck Card */}
          <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
            <Stack gap="sm">
              <h3 className="text-xl font-semibold text-slate-900">Pitch Deck</h3>

              {/* Thumbnail Preview (only if pitch exists) */}
              {title.pitch && title.pitch.trim() !== '' && (
                <PitchDeckThumbnail
                  pdfUrl={title.pitch}
                  onClick={() => {
                    trackPitchView(
                      titleId,
                      title.title_name_en || title.title_name_kr || 'Unknown Title',
                      tier
                    );
                    setCurrentPdfUrl(title.pitch);
                    setTimeout(() => setIsPdfModalOpen(true), 10);
                  }}
                  className="mb-4"
                  alt={`${title.title_name_en || title.title_name_kr} pitch deck preview`}
                />
              )}

              {/* Only show button if NO pitch deck exists */}
              {(!title.pitch || title.pitch.trim() === '') && (
                <div className="flex justify-start">
                  <Button
                    onClick={() => {
                      trackPitchView(
                        titleId,
                        title.title_name_en || title.title_name_kr || 'Unknown Title',
                        tier
                      );
                      setPremiumFeatureName("Pitch deck not available");
                      setPremiumPopupOpen(true);
                    }}
                    className="bg-pro-purple hover:bg-pro-purple-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors"
                  >
                    → Request Pitch Deck
                  </Button>
                </div>
              )}

              {/* PRD 2.1: Premium content upgrade prompt for basic users */}
              <div className="pt-4">
                <PremiumContentUpgradePrompt
                  variant="callout"
                  size="sm"
                  titleName={title.title_name_en || title.title_name_kr}
                  dismissible={true}
                />
              </div>
            </Stack>
          </div>

          {/* Synopsis */}
          <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
            <Stack gap="sm">
              <h3 className="text-xl font-semibold text-slate-900">Synopsis</h3>
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
              </div>
            </Stack>
          </div>

          {/* Additional Details */}
          {title.note && (
            <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
              <Stack gap="sm">
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-hanok-teal" />
                  Additional Notes
                </h3>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {title.note}
                  </p>
                </div>
              </Stack>
            </div>
          )}

          {/* Extended Author Information */}
          {(title.author || title.writer || title.illustrator) && (
            <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
              <Stack gap="sm">
                <h3 className="text-xl font-semibold text-slate-900">Creator Details</h3>
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
              </Stack>
            </div>
          )}
        </div>
      </div>

      {/* KStoryBridge Analysis Section - Full Width */}
      {pitchAnalysis && (
        <div className="mt-8 sm:mt-10 lg:mt-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">KStoryBridge Analysis</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

            {/* Story World Card */}
            {pitchAnalysis.story_world && (
              <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
                <Stack gap="sm">
                  <h3 className="text-xl font-semibold text-slate-900">Story World</h3>
                  <div className="space-y-3 text-slate-700">
                    {pitchAnalysis.story_world.setting && (
                      <div><span className="font-semibold">Setting:</span> {pitchAnalysis.story_world.setting}</div>
                    )}
                    {pitchAnalysis.story_world.time_period && (
                      <div><span className="font-semibold">Time Period:</span> {pitchAnalysis.story_world.time_period}</div>
                    )}
                    {pitchAnalysis.story_world.world_building && pitchAnalysis.story_world.world_building.length > 0 && (
                      <div>
                        <span className="font-semibold">World Building:</span>
                        <ul className="list-disc ml-5 mt-2">
                          {pitchAnalysis.story_world.world_building.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Stack>
              </div>
            )}

            {/* Characters Card */}
            {pitchAnalysis.characters && pitchAnalysis.characters.length > 0 && (
              <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
                <Stack gap="sm">
                  <h3 className="text-xl font-semibold text-slate-900">Characters</h3>
                  <div className="space-y-4">
                    {pitchAnalysis.characters.map((char, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                        <div className="font-semibold text-slate-900 mb-2">{char.name}</div>
                        <div className="text-sm space-y-1 text-slate-700">
                          {char.role && <div><span className="font-semibold">Role:</span> {char.role}</div>}
                          {char.archetype && <div><span className="font-semibold">Archetype:</span> {char.archetype}</div>}
                          {char.description && <div className="mt-2">{char.description}</div>}
                          {char.key_traits && char.key_traits.length > 0 && (
                            <div className="mt-2">
                              <span className="font-semibold">Key Traits:</span> {char.key_traits.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Stack>
              </div>
            )}

            {/* Themes & Tone Card */}
            {pitchAnalysis.themes_and_tone && (
              <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
                <Stack gap="sm">
                  <h3 className="text-xl font-semibold text-slate-900">Themes & Tone</h3>
                  <div className="space-y-3 text-slate-700">
                    {pitchAnalysis.themes_and_tone.primary_themes && pitchAnalysis.themes_and_tone.primary_themes.length > 0 && (
                      <div>
                        <span className="font-semibold">Primary Themes:</span> {pitchAnalysis.themes_and_tone.primary_themes.join(', ')}
                      </div>
                    )}
                    {pitchAnalysis.themes_and_tone.emotional_tone && (
                      <div><span className="font-semibold">Emotional Tone:</span> {pitchAnalysis.themes_and_tone.emotional_tone}</div>
                    )}
                    {pitchAnalysis.themes_and_tone.visual_style && (
                      <div><span className="font-semibold">Visual Style:</span> {pitchAnalysis.themes_and_tone.visual_style}</div>
                    )}
                    {pitchAnalysis.themes_and_tone.mood_keywords && pitchAnalysis.themes_and_tone.mood_keywords.length > 0 && (
                      <div>
                        <span className="font-semibold">Mood Keywords:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {pitchAnalysis.themes_and_tone.mood_keywords.map((keyword, idx) => (
                            <Badge key={idx} className="bg-slate-100 text-slate-700">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Stack>
              </div>
            )}

            {/* Story Elements Card */}
            {pitchAnalysis.story_elements && (
              <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
                <Stack gap="sm">
                  <h3 className="text-xl font-semibold text-slate-900">Story Elements</h3>
                  <div className="space-y-3 text-slate-700">
                    {pitchAnalysis.story_elements.logline && (
                      <div className="p-4 bg-hanok-teal/5 border-l-4 border-hanok-teal rounded-r-lg">
                        <span className="font-semibold">Logline:</span> {pitchAnalysis.story_elements.logline}
                      </div>
                    )}
                    {pitchAnalysis.story_elements.plot_summary && (
                      <div><span className="font-semibold">Plot Summary:</span> {pitchAnalysis.story_elements.plot_summary}</div>
                    )}
                    {pitchAnalysis.story_elements.genre_blend && pitchAnalysis.story_elements.genre_blend.length > 0 && (
                      <div><span className="font-semibold">Genre Blend:</span> {pitchAnalysis.story_elements.genre_blend.join(', ')}</div>
                    )}
                    {pitchAnalysis.story_elements.narrative_structure && (
                      <div><span className="font-semibold">Narrative Structure:</span> {pitchAnalysis.story_elements.narrative_structure}</div>
                    )}
                  </div>
                </Stack>
              </div>
            )}

            {/* Market Positioning Card */}
            {pitchAnalysis.market_positioning && (
              <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
                <Stack gap="sm">
                  <h3 className="text-xl font-semibold text-slate-900">Market Positioning</h3>
                  <div className="space-y-3 text-slate-700">
                    {pitchAnalysis.market_positioning.target_audience && (
                      <div>
                        <span className="font-semibold">Target Audience:</span>
                        <div className="ml-4 mt-2 space-y-1">
                          {pitchAnalysis.market_positioning.target_audience.age_range && (
                            <div>Age Range: {pitchAnalysis.market_positioning.target_audience.age_range}</div>
                          )}
                          {pitchAnalysis.market_positioning.target_audience.psychographics && (
                            <div>Psychographics: {pitchAnalysis.market_positioning.target_audience.psychographics}</div>
                          )}
                        </div>
                      </div>
                    )}
                    {pitchAnalysis.market_positioning.comparable_titles && pitchAnalysis.market_positioning.comparable_titles.length > 0 && (
                      <div>
                        <span className="font-semibold">Comparable Titles:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {pitchAnalysis.market_positioning.comparable_titles.map((comp, idx) => (
                            <div key={idx} className="p-2 bg-slate-50 rounded">
                              <div className="font-medium">{comp.title}</div>
                              <div className="text-sm text-slate-600">{comp.platform}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {pitchAnalysis.market_positioning.platform_fit && pitchAnalysis.market_positioning.platform_fit.length > 0 && (
                      <div><span className="font-semibold">Platform Fit:</span> {pitchAnalysis.market_positioning.platform_fit.join(', ')}</div>
                    )}
                  </div>
                </Stack>
              </div>
            )}

            {/* Korean Cultural Elements Card */}
            {pitchAnalysis.korean_cultural_elements && pitchAnalysis.korean_cultural_elements.length > 0 && (
              <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
                <Stack gap="sm">
                  <h3 className="text-xl font-semibold text-slate-900">Korean Cultural Elements</h3>
                  <ul className="list-disc ml-5 space-y-1 text-slate-700">
                    {pitchAnalysis.korean_cultural_elements.map((element, idx) => (
                      <li key={idx}>{element}</li>
                    ))}
                  </ul>
                </Stack>
              </div>
            )}

            {/* IP Value Card */}
            {pitchAnalysis.ip_value && (
              <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
                <Stack gap="sm">
                  <h3 className="text-xl font-semibold text-slate-900">IP Value</h3>
                  <div className="space-y-3 text-slate-700">
                    {pitchAnalysis.ip_value.franchise_potential && (
                      <div><span className="font-semibold">Franchise Potential:</span> {pitchAnalysis.ip_value.franchise_potential}</div>
                    )}
                    {pitchAnalysis.ip_value.cross_media_potential && pitchAnalysis.ip_value.cross_media_potential.length > 0 && (
                      <div>
                        <span className="font-semibold">Cross-Media Potential:</span>
                        <ul className="list-disc ml-5 mt-2">
                          {pitchAnalysis.ip_value.cross_media_potential.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {pitchAnalysis.ip_value.merchandising_opportunities && pitchAnalysis.ip_value.merchandising_opportunities.length > 0 && (
                      <div>
                        <span className="font-semibold">Merchandising Opportunities:</span>
                        <ul className="list-disc ml-5 mt-2">
                          {pitchAnalysis.ip_value.merchandising_opportunities.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {pitchAnalysis.ip_value.unique_selling_points && pitchAnalysis.ip_value.unique_selling_points.length > 0 && (
                      <div>
                        <span className="font-semibold">Unique Selling Points:</span>
                        <ul className="list-disc ml-5 mt-2">
                          {pitchAnalysis.ip_value.unique_selling_points.map((usp, idx) => (
                            <li key={idx}>{usp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Stack>
              </div>
            )}

            {/* Production Details Card */}
            {pitchAnalysis.production_details && (
              <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
                <Stack gap="sm">
                  <h3 className="text-xl font-semibold text-slate-900">Production Details</h3>
                  <div className="space-y-3 text-slate-700">
                    {pitchAnalysis.production_details.format && (
                      <div><span className="font-semibold">Format:</span> {pitchAnalysis.production_details.format}</div>
                    )}
                    {pitchAnalysis.production_details.adaptation_type && (
                      <div><span className="font-semibold">Adaptation Type:</span> {pitchAnalysis.production_details.adaptation_type}</div>
                    )}
                  </div>
                </Stack>
              </div>
            )}

            {/* Source Material Card */}
            {pitchAnalysis.source_material && (
              <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
                <Stack gap="sm">
                  <h3 className="text-xl font-semibold text-slate-900">Source Material</h3>
                  <div className="space-y-3 text-slate-700">
                    {pitchAnalysis.source_material.original_platform && (
                      <div><span className="font-semibold">Platform:</span> {pitchAnalysis.source_material.original_platform}</div>
                    )}
                    {pitchAnalysis.source_material.metrics && (
                      <div>
                        <span className="font-semibold">Metrics:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                          {pitchAnalysis.source_material.metrics.views && (
                            <div className="p-2 bg-slate-50 rounded">
                              <div className="text-sm text-slate-600">Views</div>
                              <div className="font-medium">{pitchAnalysis.source_material.metrics.views}</div>
                            </div>
                          )}
                          {pitchAnalysis.source_material.metrics.chapters && (
                            <div className="p-2 bg-slate-50 rounded">
                              <div className="text-sm text-slate-600">Chapters</div>
                              <div className="font-medium">{pitchAnalysis.source_material.metrics.chapters}</div>
                            </div>
                          )}
                          {pitchAnalysis.source_material.metrics.rating && (
                            <div className="p-2 bg-slate-50 rounded">
                              <div className="text-sm text-slate-600">Rating</div>
                              <div className="font-medium">{pitchAnalysis.source_material.metrics.rating}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Stack>
              </div>
            )}

            {/* Content Classification Card */}
            {pitchAnalysis.content_classification && (
              <div className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl p-4 sm:p-6">
                <Stack gap="sm">
                  <h3 className="text-xl font-semibold text-slate-900">Content Classification</h3>
                  <div className="space-y-3 text-slate-700">
                    {pitchAnalysis.content_classification.maturity_rating && (
                      <div><span className="font-semibold">Maturity Rating:</span> {pitchAnalysis.content_classification.maturity_rating}</div>
                    )}
                    {pitchAnalysis.content_classification.content_warnings && pitchAnalysis.content_classification.content_warnings.length > 0 && (
                      <div>
                        <span className="font-semibold">Content Warnings:</span> {pitchAnalysis.content_classification.content_warnings.join(', ')}
                      </div>
                    )}
                    {pitchAnalysis.content_classification.complexity_score !== undefined && (
                      <div><span className="font-semibold">Complexity Score:</span> {pitchAnalysis.content_classification.complexity_score}/10</div>
                    )}
                  </div>
                </Stack>
              </div>
            )}

          </div>
        </div>
      )}

      {/* PDF Modal */}
      {isPdfModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setIsPdfModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] h-auto relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPdfModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0"
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="h-full">
              <SecurePDFViewer
                pdfUrl={currentPdfUrl}
                userTier={tier}
                maxPagesForBasic={5}
              />
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
          premiumFeatureName === "Request a pitch deck" || premiumFeatureName === "Pitch deck not available" ? "pitch" :
          premiumFeatureName === "Contact Creator" ? "contact" :
          undefined
        }
      />

    </PageContainer>
  );
}

export default function TitleDetailNew() {
  const { pathname } = useLocation();
  const isCreatorView = pathname.startsWith('/creators');

  // Only wrap with TierProvider for buyers (creators don't use tiers)
  if (isCreatorView) {
    return <TitleDetailNewContent />;
  }

  return (
    <TierProvider>
      <TitleDetailNewContent />
    </TierProvider>
  );
}
