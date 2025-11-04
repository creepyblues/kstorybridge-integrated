import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTierAccess } from '@/contexts/TierContext';
import { titlesService, Title } from '@/services/titlesService';
import { useDataCache } from '@/contexts/DataCacheContext';
import { directApiService } from '@/services/directApiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Heart, ExternalLink, Loader2, FileText, X, MessageCircle } from 'lucide-react';
import { trackSavedTitle, trackPitchView, trackContactCreatorClick } from '@/utils/analytics';

// Layout
import { BuyerLayout } from '@/components/layout/BuyerLayout';

// Phase 3 Components
import { Stack } from '@/components/layout/Stack';
import OptimizedTierGatedContent from '@/components/tier/OptimizedTierGatedContent';
import PitchDeckThumbnail from '@/components/premium/PitchDeckThumbnail';
import SecurePDFViewer from '@/components/premium/SecurePDFViewer';
import PremiumFeaturePopup from '@/components/premium/PremiumFeaturePopup';
import { ContactUpgradePrompt, PremiumContentUpgradePrompt } from '@/components/premium/UpgradePrompt';

export default function TitleDetail() {
  const { titleId } = useParams<{ titleId: string }>();
  const { user } = useAuth();
  const { tier } = useTierAccess();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getTitleDetail, setTitleDetail, isFresh, setDbConnectivityStatus, getDbConnectivityStatus } = useDataCache();

  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>('');
  const [pitchTracked, setPitchTracked] = useState(false);
  const [premiumPopupOpen, setPremiumPopupOpen] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState<string>('');

  useEffect(() => {
    const fetchTitle = async () => {
      if (!titleId) return;

      // Check cache first
      const cacheKey = `titleDetail:${titleId}`;
      if (isFresh(cacheKey)) {
        const cachedTitle = getTitleDetail(titleId);
        if (cachedTitle) {
          console.log('📦 Using cached title data:', cachedTitle.title_name_en || cachedTitle.title_name_kr);
          setTitle(cachedTitle);
          setLoading(false);

          // Still check favorite status (not cached)
          if (user?.id) {
            try {
              const favorited = await directApiService.isTitleFavorited(user.id, titleId);
              setIsFavorited(favorited);
            } catch (error) {
              console.warn('Could not check favorite status:', error);
            }
          }
          return;
        }
      }

      // Not cached or stale - fetch from API
      setLoading(true);
      setDbError(null);
      try {
        const data = await directApiService.getTitleById(titleId);
        setTitle(data);
        setTitleDetail(titleId, data);
        setDbConnectivityStatus({ isConnected: true });

        // Check if favorited
        if (data && user?.id) {
          const favorited = await directApiService.isTitleFavorited(user.id, titleId);
          setIsFavorited(favorited);
        }
      } catch (error: any) {
        console.error('Error fetching title:', error);
        const errorMessage = error.message || 'Failed to fetch title details';
        setDbConnectivityStatus({ isConnected: false, error: errorMessage });
        setDbError(errorMessage);
        toast({
          title: 'Database Connection Error',
          description: 'Unable to load title details. Please check your connection and try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTitle();
  }, [titleId, user?.id, toast, getTitleDetail, setTitleDetail, isFresh, setDbConnectivityStatus]);

  const handleFavoriteToggle = async () => {
    if (!title || !user?.id) return;

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await directApiService.removeFromFavorites(user.id, title.title_id);
        setIsFavorited(false);
        toast({
          title: 'Removed from favorites',
          description: 'Title removed from your saved list',
        });
      } else {
        await directApiService.addToFavorites(user.id, title.title_id);
        setIsFavorited(true);

        // Track save action with enhanced parameters
        trackSavedTitle(
          title.title_id,
          title.title_name_en || title.title_name_kr || 'Unknown Title',
          'search',
          user.id
        );

        toast({
          title: 'Added to favorites',
          description: 'Title saved to your list',
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      const errorMessage = error.message || 'Failed to update favorites';
      setDbConnectivityStatus({ isConnected: false, error: errorMessage });
      setDbError(errorMessage);
      toast({
        title: 'Database Connection Error',
        description: 'Unable to update favorites. Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Track pitch deck view when it's displayed
  useEffect(() => {
    if (title?.pitch && !pitchTracked && tier && tier !== 'invited') {
      trackPitchView(
        title.title_id,
        title.title_name_en || title.title_name_kr || 'Unknown Title',
        tier
      );
      setPitchTracked(true);
    }
  }, [title, tier, pitchTracked]);

  if (loading) {
    return (
      <BuyerLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </BuyerLayout>
    );
  }

  // Database Connectivity Error UI
  if (dbError && !getDbConnectivityStatus().isConnected) {
    return (
      <BuyerLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
          <Card className="border-red-200 shadow-lg max-w-md w-full">
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
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        </div>
      </BuyerLayout>
    );
  }

  if (!title) {
    return (
      <BuyerLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          <p className="text-gray-500 text-lg mb-4">Title not found</p>
          <Button variant="outline" onClick={() => navigate('/buyers/titles')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Titles
          </Button>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      {/* Header */}
      <div className="border-b border-gray-300 bg-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 py-3 mb-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/buyers/titles')}
            className="border-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFavoriteToggle}
            disabled={favoriteLoading}
            className={`border-gray-300 ${
              isFavorited ? 'bg-red-50 text-red-600 hover:bg-red-100' : ''
            }`}
          >
            <Heart
              className={`h-4 w-4 mr-1 ${isFavorited ? 'fill-current' : ''}`}
            />
            {isFavorited ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto">
        {/* Mobile Hero Section */}
        <div className="sm:hidden mb-6">
          {/* Mobile: Full width image first */}
          {title.title_image && (
            <div className="w-full h-64 bg-gray-100 rounded-2xl overflow-hidden mb-4">
              <img
                src={title.title_image}
                alt={title.title_name_en || title.title_name_kr || 'Title'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Mobile: Title and metadata below */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black mb-2">
              {title.title_name_en || title.title_name_kr}
            </h1>
            {title.title_name_kr && title.title_name_en && (
              <p className="text-lg text-gray-600 mb-3">{title.title_name_kr}</p>
            )}
            {title.tagline && (
              <p className="text-base text-gray-500 italic mt-2">{title.tagline}</p>
            )}
          </div>
        </div>

        {/* Desktop Hero Section */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-6 mb-6">
          {/* Desktop: Image on left */}
          <div className="col-span-1">
            {title.title_image && (
              <div className="w-full rounded-2xl overflow-hidden bg-gray-100 sticky top-6">
                <img
                  src={title.title_image}
                  alt={title.title_name_en || title.title_name_kr || 'Title'}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Desktop: Details on right */}
          <div className="col-span-2">
            <h1 className="text-3xl font-bold text-black mb-2">
              {title.title_name_en || title.title_name_kr}
            </h1>
            {title.title_name_kr && title.title_name_en && (
              <p className="text-xl text-gray-600">{title.title_name_kr}</p>
            )}
            {title.tagline && (
              <p className="text-lg text-gray-500 italic mt-2">{title.tagline}</p>
            )}
          </div>
        </div>

        {/* Content Section (shared across mobile/desktop) */}
        <div>
          <Stack gap="md">

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2">
              {title.genre && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {title.genre}
                </span>
              )}
              {title.content_format && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {title.content_format}
                </span>
              )}
              {title.completed !== undefined && (
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    title.completed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {title.completed ? 'Completed' : 'Ongoing'}
                </span>
              )}
            </div>

            {/* Stats */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
                  {title.views !== undefined && (
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-black">
                        {titlesService.formatNumber(title.views)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Views</div>
                    </div>
                  )}
                  {title.rating != null && (
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-black">
                        {title.rating.toFixed(1)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Rating</div>
                    </div>
                  )}
                  {title.chapters !== undefined && (
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-black">
                        {title.chapters}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Chapters</div>
                    </div>
                  )}
                  {title.rating_count !== undefined && (
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-black">
                        {titlesService.formatNumber(title.rating_count)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Ratings</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Synopsis */}
            {title.synopsis && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-black mb-3">Synopsis</h2>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {title.synopsis}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Contact Creator Section */}
            <Card className="border-teal-300 border-2">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-black mb-1">Interested in this title?</h2>
                    <p className="text-sm text-gray-600">Contact the rights holder to learn more</p>
                  </div>
                  <OptimizedTierGatedContent requiredTier="pro">
                    <Button
                      variant="outline"
                      onClick={() => {
                        trackContactCreatorClick(
                          title.title_id,
                          title.title_name_en || title.title_name_kr || 'Unknown Title',
                          tier || 'basic',
                          'title_detail'
                        );
                        setPremiumFeatureName('Contact Creator');
                        setPremiumPopupOpen(true);
                      }}
                      className="border-teal-600 text-teal-600 hover:bg-teal-50"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Creator
                    </Button>
                  </OptimizedTierGatedContent>
                </div>
              </CardContent>
            </Card>

            {/* Contact Upgrade Prompt for Basic Tier */}
            <ContactUpgradePrompt
              titleName={title.title_name_en || title.title_name_kr}
              variant="callout"
              size="md"
            />

            {/* Author Info */}
            {title.author && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-black mb-3">Credits</h2>
                  <div className="space-y-2 text-sm sm:text-base text-gray-700">
                    <p>
                      <span className="font-medium">Author:</span> {title.author}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {title.tags && title.tags.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-black mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {title.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tier-Gated Pitch Deck */}
            {title.pitch && (
              <>
                <OptimizedTierGatedContent requiredTier="pro">
                  <Card className="border-purple-300 border-2">
                    <CardContent className="p-4 sm:p-6">
                      <Stack gap="sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-purple-600" />
                          <h2 className="text-lg font-bold text-black">Pitch Deck</h2>
                          <span className="ml-auto px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-semibold rounded-full">
                            PRO
                          </span>
                        </div>

                        {/* PDF Thumbnail Preview */}
                        {title.pitch.startsWith('http') && (
                          <PitchDeckThumbnail
                            pdfUrl={title.pitch}
                            onClick={() => {
                              trackPitchView(
                                title.title_id,
                                title.title_name_en || title.title_name_kr || 'Unknown Title',
                                tier || 'basic'
                              );
                              setCurrentPdfUrl(title.pitch || '');
                              setIsPdfModalOpen(true);
                            }}
                            alt={`${title.title_name_en || title.title_name_kr} pitch deck preview`}
                          />
                        )}

                        {/* PDF Button (shown with thumbnail for clarity) */}
                        {title.pitch.startsWith('http') ? (
                          <Button
                            variant="outline"
                            onClick={() => {
                              trackPitchView(
                                title.title_id,
                                title.title_name_en || title.title_name_kr || 'Unknown Title',
                                tier || 'basic'
                              );
                              setCurrentPdfUrl(title.pitch || '');
                              setIsPdfModalOpen(true);
                            }}
                            className="w-full border-gray-300"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Pitch Deck (PDF)
                          </Button>
                        ) : (
                          <div className="prose prose-sm max-w-none">
                            <div
                              className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: title.pitch }}
                            />
                          </div>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </OptimizedTierGatedContent>

                {/* Premium Content Upgrade Prompt for Basic Tier */}
                <PremiumContentUpgradePrompt
                  titleName={title.title_name_en || title.title_name_kr}
                  variant="callout"
                  size="md"
                />
              </>
            )}

            {/* External Link */}
            {title.title_url && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <Button
                    variant="outline"
                    onClick={() => window.open(title.title_url, '_blank')}
                    className="w-full border-gray-300 text-sm sm:text-base"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Original Source
                  </Button>
                </CardContent>
              </Card>
            )}
          </Stack>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {isPdfModalOpen && currentPdfUrl && (
        <div
          className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
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
        requestType={premiumFeatureName === 'Contact Creator' ? 'contact' : 'pitch'}
        titleName={title?.title_name_en || title?.title_name_kr || 'Unknown Title'}
      />
    </BuyerLayout>
  );
}
