import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title } from '@/services/titlesService';
import { type PitchAnalysis } from '@/types/pitchAnalysis';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { TierGatedContent } from '@/components/tier/TierGatedContent';
import { useTierAccess } from '@/contexts/TierContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, ExternalLink, Loader2, X, Eye, BookOpen, Calendar } from 'lucide-react';
import SecurePDFViewer from '@/components/premium/SecurePDFViewer';
import PitchDeckThumbnail from '@/components/premium/PitchDeckThumbnail';

export default function TitleDetail() {
  const { titleId } = useParams<{ titleId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tier } = useTierAccess();

  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [pitchAnalysis, setPitchAnalysis] = useState<PitchAnalysis | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>("");

  useEffect(() => {
    const fetchTitle = async () => {
      if (!titleId) return;

      setLoading(true);
      try {
        const data = await titlesService.getTitleById(titleId);
        setTitle(data);

        // Extract pitch_analysis if available (confidence filter removed for testing)
        console.log('[TitleDetail] Title data received:', {
          title_id: data?.title_id,
          has_pitch: !!data?.pitch,
          has_pitch_analysis: !!data?.pitch_analysis,
          processing_confidence: data?.processing_confidence
        });

        // Extract pitch_analysis if available (confidence filter removed for testing)
        if (data?.pitch_analysis) {
          console.log('[TitleDetail] ✅ Setting pitch_analysis - confidence:', data.processing_confidence);
          setPitchAnalysis(data.pitch_analysis);
        } else {
          console.log('[TitleDetail] ❌ No pitch_analysis data available');
          setPitchAnalysis(null);
        }

        // Check if favorited
        if (data && user?.id) {
          const favorited = await titlesService.isFavorited(titleId, user.id);
          setIsFavorited(favorited);
        }
      } catch (error: any) {
        console.error('Error fetching title:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch title details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTitle();
  }, [titleId, user?.id, toast]);

  const handleFavoriteToggle = async () => {
    if (!title || !user?.id) return;

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await titlesService.removeFavorite(title.title_id, user.id);
        setIsFavorited(false);
        toast({
          title: 'Removed from favorites',
          description: 'Title removed from your saved list',
        });
      } else {
        await titlesService.addFavorite(title.title_id, user.id);
        setIsFavorited(true);
        toast({
          title: 'Added to favorites',
          description: 'Title saved to your list',
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update favorites',
        variant: 'destructive',
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <BuyerLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Hero Section - Full Width */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Mobile: Full width image first */}
            <div className="sm:hidden mb-4">
              <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden shadow-xl ring-1 ring-gray-200">
                {title.title_image ? (
                  <img
                    src={title.title_image}
                    alt={title.title_name_en || title.title_name_kr || 'Title'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#4C9C9B]/10 to-[#4C9C9B]/20 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-[#4C9C9B]" />
                  </div>
                )}
              </div>
            </div>

            {/* Desktop: Side-by-side layout */}
            <div className="hidden sm:flex sm:items-start gap-4 sm:gap-6 mb-4">
              <div className="w-32 h-44 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-xl ring-1 ring-gray-200">
                {title.title_image ? (
                  <img
                    src={title.title_image}
                    alt={title.title_name_en || title.title_name_kr || 'Title'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#4C9C9B]/10 to-[#4C9C9B]/20 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-[#4C9C9B]" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black mb-2 sm:mb-3 leading-tight">
                  {title.title_name_en || title.title_name_kr}
                </h2>
                {title.title_name_kr && title.title_name_en && (
                  <p className="text-lg sm:text-xl text-gray-600 font-medium mb-3 sm:mb-4">
                    {title.title_name_kr}
                  </p>
                )}

                {/* Author info - Story and Art on same line */}
                <div className="flex flex-row flex-wrap gap-4 sm:gap-6 text-sm sm:text-base text-gray-600 justify-center sm:justify-start">
                  {title.story_author && (
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-[#4C9C9B]">Story:</span>
                      <span className="font-medium">{title.story_author}</span>
                    </span>
                  )}
                  {title.art_author && (
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-[#4C9C9B]">Art:</span>
                      <span className="font-medium">{title.art_author}</span>
                    </span>
                  )}
                </div>

                {/* Quick stats - views/chapters/status in one line */}
                <div className="flex flex-row items-center gap-3 sm:gap-6 mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 justify-center sm:justify-start flex-wrap">
                  {title.views !== undefined && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-medium">{titlesService.formatNumber(title.views)} views</span>
                    </div>
                  )}
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
              <h2 className="text-2xl font-bold text-hanok-teal mb-2 leading-tight text-center">
                {title.title_name_en || title.title_name_kr}
              </h2>
              {title.title_name_kr && title.title_name_en && (
                <p className="text-lg text-gray-600 font-medium mb-3 text-center">
                  {title.title_name_kr}
                </p>
              )}

              {/* Author info - Story and Art on same line */}
              <div className="flex flex-row flex-wrap gap-4 text-sm text-gray-600 justify-center">
                {title.story_author && (
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-[#4C9C9B]">Story:</span>
                    <span className="font-medium">{title.story_author}</span>
                  </span>
                )}
                {title.art_author && (
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-[#4C9C9B]">Art:</span>
                    <span className="font-medium">{title.art_author}</span>
                  </span>
                )}
              </div>

              {/* Quick stats - views/chapters/status in one line */}
              <div className="flex flex-row items-center gap-3 mt-3 text-xs text-gray-500 justify-center flex-wrap">
                {title.views !== undefined && (
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3" />
                    <span className="font-medium">{titlesService.formatNumber(title.views)} views</span>
                  </div>
                )}
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

          {/* Action Buttons - Right side */}
          <div className="flex flex-row gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end">
            <Button
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
              variant="outline"
              className={`flex-1 lg:flex-none border-gray-200 hover:bg-hanok-teal/5 hover:border-hanok-teal/30 px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base transition-colors ${
                isFavorited ? 'bg-red-50 text-red-600 hover:bg-red-100' : ''
              }`}
            >
              <Heart className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isFavorited ? 'fill-current' : ''}`} />
              {isFavorited ? 'Saved' : 'Save'}
            </Button>

            {title.title_url && (
              <Button
                variant="outline"
                className="flex-1 lg:flex-none border-gray-200 hover:bg-hanok-teal/5 hover:border-hanok-teal/30 px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base transition-colors"
                onClick={() => window.open(title.title_url, '_blank')}
              >
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                View Original
              </Button>
            )}
          </div>
        </div>

        {/* Horizontal divider */}
        <div className="py-2">
          <hr className="border-gray-200" />
        </div>

        {/* Content Area - Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Left Column - Business Critical Info */}
          <div className="space-y-4 sm:space-y-6">

            {/* Business Information Card */}
            <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-xl font-semibold text-black mb-4">
                  Business Information
                </h3>
                <div className="space-y-4">

                  {/* Rights Holder */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-700">Rights Holder</h5>
                      <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                        {title.rights_holder_name || title.rights_holder_company || title.rights || 'MANTA/RIDI'}
                      </span>
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                        className="bg-[#AF52DE] hover:bg-[#AF52DE]/80 text-white text-xs font-semibold px-2.5 py-0.5 h-auto rounded-full transition-colors"
                      >
                        Contact
                      </Button>
                    </div>
                  </div>

                  {/* Target Market Info - Tier gated */}
                  <TierGatedContent requiredTier="basic">
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      {/* Perfect For */}
                      {title.perfect_for && (
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-700">Perfect For</h5>
                          <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                            {title.perfect_for}
                          </span>
                        </div>
                      )}

                      {/* Audience */}
                      {title.audience && (
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-700">Audience</h5>
                          <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                            {title.audience}
                          </span>
                        </div>
                      )}

                      {/* Comps */}
                      {title.comps && title.comps.length > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                          <h5 className="font-medium text-gray-700">Comps</h5>
                          <div className="font-bold text-[#4C9C9B] uppercase text-xs text-right break-words">
                            {title.comps.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </TierGatedContent>
                </div>
              </CardContent>
            </Card>

            {/* Content Details Card */}
            <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-xl font-semibold text-black mb-4">Content Details</h3>
                <div className="space-y-4">
                  {/* Format */}
                  {title.content_format && (
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-700">Format</h5>
                      <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                        {title.content_format.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Series Status */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-700">Series Status</h5>
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {title.completed ? 'COMPLETED' : 'ONGOING'}
                    </span>
                  </div>

                  {/* Genre */}
                  {title.genre && Array.isArray(title.genre) && title.genre.length > 0 && (
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-700">Genre</h5>
                      <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                        {title.genre.slice(0, 2).map((g: string) => g.replace('_', ' ')).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Keywords Card */}
            {title.keywords && title.keywords.length > 0 && (
              <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-xl font-semibold text-black mb-4">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {title.keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 font-medium px-2.5 py-1 rounded-full text-xs hover:bg-gray-200 transition-colors uppercase">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Right Column - Content Overview */}
          <div className="space-y-4 sm:space-y-6">

            {/* Pitch Deck Card */}
            {title.pitch && title.pitch.trim() !== '' && (
              <TierGatedContent requiredTier="pro">
                <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-xl font-semibold text-black">Pitch Deck</h3>
                      <span className="ml-auto px-2 py-0.5 bg-[#AF52DE]/10 text-[#AF52DE] text-xs font-semibold rounded-full">
                        PRO
                      </span>
                    </div>

                    {/* PDF Thumbnail Preview */}
                    <PitchDeckThumbnail
                      pdfUrl={title.pitch}
                      onClick={() => {
                        setCurrentPdfUrl(title.pitch || '');
                        setTimeout(() => setIsPdfModalOpen(true), 10);
                      }}
                      alt={`${title.title_name_en || title.title_name_kr} pitch deck preview`}
                    />
                  </CardContent>
                </Card>
              </TierGatedContent>
            )}

            {/* Synopsis Card */}
            {title.synopsis && (
              <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-xl font-semibold text-black mb-4">Synopsis</h3>
                  <div className="space-y-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {title.synopsis}
                    </p>

                    {/* Tagline Highlight */}
                    {title.tagline && (
                      <div className="mt-4 p-4 bg-[#4C9C9B]/5 border-l-4 border-[#4C9C9B] rounded-r-lg">
                        <p className="text-gray-700 font-medium italic">
                          "{title.tagline}"
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>

        {/* KStoryBridge Analysis Section - Full Width */}
        {pitchAnalysis && (
          <div className="mt-8 sm:mt-10 lg:mt-12">
            <h2 className="text-2xl font-bold text-hanok-teal mb-6">KStoryBridge Analysis</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Story World Card */}
              {pitchAnalysis.story_world && (
                <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xl font-semibold text-black mb-4">Story World</h3>
                    <div className="space-y-3 text-gray-700">
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
                  </CardContent>
                </Card>
              )}

              {/* Characters Card */}
              {pitchAnalysis.characters && pitchAnalysis.characters.length > 0 && (
                <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xl font-semibold text-black mb-4">Characters</h3>
                    <div className="space-y-4">
                      {pitchAnalysis.characters.map((char, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                          <div className="font-semibold text-black mb-2">{char.name}</div>
                          <div className="text-sm space-y-1 text-gray-700">
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
                  </CardContent>
                </Card>
              )}

              {/* Themes & Tone Card */}
              {pitchAnalysis.themes_and_tone && (
                <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xl font-semibold text-black mb-4">Themes & Tone</h3>
                    <div className="space-y-3 text-gray-700">
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
                              <span key={idx} className="px-2.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">{keyword}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Story Elements Card */}
              {pitchAnalysis.story_elements && (
                <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xl font-semibold text-black mb-4">Story Elements</h3>
                    <div className="space-y-3 text-gray-700">
                      {pitchAnalysis.story_elements.logline && (
                        <div className="p-4 bg-gray-50 border-l-4 border-[#4C9C9B] rounded-r-lg">
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
                  </CardContent>
                </Card>
              )}

              {/* Market Positioning Card */}
              {pitchAnalysis.market_positioning && (
                <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xl font-semibold text-black mb-4">Market Positioning</h3>
                    <div className="space-y-3 text-gray-700">
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
                              <div key={idx} className="p-2 bg-gray-50 rounded">
                                <div className="font-medium">{comp.title}</div>
                                <div className="text-sm text-gray-600">{comp.platform}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {pitchAnalysis.market_positioning.platform_fit && pitchAnalysis.market_positioning.platform_fit.length > 0 && (
                        <div><span className="font-semibold">Platform Fit:</span> {pitchAnalysis.market_positioning.platform_fit.join(', ')}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* IP Value Card */}
              {pitchAnalysis.ip_value && (
                <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xl font-semibold text-black mb-4">IP Value</h3>
                    <div className="space-y-3 text-gray-700">
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
                  </CardContent>
                </Card>
              )}

              {/* Production Details Card */}
              {pitchAnalysis.production_details && (
                <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xl font-semibold text-black mb-4">Production Details</h3>
                    <div className="space-y-3 text-gray-700">
                      {pitchAnalysis.production_details.format && (
                        <div><span className="font-semibold">Format:</span> {pitchAnalysis.production_details.format}</div>
                      )}
                      {pitchAnalysis.production_details.adaptation_type && (
                        <div><span className="font-semibold">Adaptation Type:</span> {pitchAnalysis.production_details.adaptation_type}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Source Material Card */}
              {pitchAnalysis.source_material && (
                <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xl font-semibold text-black mb-4">Source Material</h3>
                    <div className="space-y-3 text-gray-700">
                      {pitchAnalysis.source_material.original_platform && (
                        <div><span className="font-semibold">Platform:</span> {pitchAnalysis.source_material.original_platform}</div>
                      )}
                      {pitchAnalysis.source_material.metrics && (
                        <div>
                          <span className="font-semibold">Metrics:</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                            {pitchAnalysis.source_material.metrics.views && (
                              <div className="p-2 bg-gray-50 rounded">
                                <div className="text-sm text-gray-600">Views</div>
                                <div className="font-medium">{pitchAnalysis.source_material.metrics.views}</div>
                              </div>
                            )}
                            {pitchAnalysis.source_material.metrics.chapters && (
                              <div className="p-2 bg-gray-50 rounded">
                                <div className="text-sm text-gray-600">Chapters</div>
                                <div className="font-medium">{pitchAnalysis.source_material.metrics.chapters}</div>
                              </div>
                            )}
                            {pitchAnalysis.source_material.metrics.rating && (
                              <div className="p-2 bg-gray-50 rounded">
                                <div className="text-sm text-gray-600">Rating</div>
                                <div className="font-medium">{pitchAnalysis.source_material.metrics.rating}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Korean Cultural Elements Card */}
              {pitchAnalysis.korean_cultural_elements && pitchAnalysis.korean_cultural_elements.length > 0 && (
                <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xl font-semibold text-black mb-4">Korean Cultural Elements</h3>
                    <ul className="list-disc ml-5 space-y-1 text-gray-700">
                      {pitchAnalysis.korean_cultural_elements.map((element, idx) => (
                        <li key={idx}>{element}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Content Classification Card */}
              {pitchAnalysis.content_classification && (
                <Card className="bg-transparent border-2 border-green-700 shadow-none rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xl font-semibold text-black mb-4">Content Classification</h3>
                    <div className="space-y-3 text-gray-700">
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
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        )}

        {/* PDF Modal */}
        {isPdfModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-xl overflow-hidden relative">
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
      </div>
    </BuyerLayout>
  );
}
