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
import { ArrowLeft, Heart, ExternalLink, Loader2, FileText, X } from 'lucide-react';
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

        if (data?.pitch_analysis) {
          console.log('[TitleDetail] ✅ Setting pitch_analysis - confidence:', data.processing_confidence);
          setPitchAnalysis(data.pitch_analysis);
        } else {
          console.log('[TitleDetail] ❌ No pitch_analysis data available');
        // Extract pitch_analysis if available and meets quality threshold
        if (data?.pitch_analysis && (data.processing_confidence ?? 0) >= 0.70) {
          setPitchAnalysis(data.pitch_analysis);
        } else {
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
      {/* Header */}
      <div className="border-b border-gray-300 bg-white px-4 py-3 mb-6">
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
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image */}
          <div className="lg:col-span-1">
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

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Header */}
            <div>
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
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {title.views !== undefined && (
                    <div>
                      <div className="text-2xl font-bold text-black">
                        {titlesService.formatNumber(title.views)}
                      </div>
                      <div className="text-sm text-gray-500">Views</div>
                    </div>
                  )}
                  {title.rating != null && (
                    <div>
                      <div className="text-2xl font-bold text-black">
                        {title.rating.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">Rating</div>
                    </div>
                  )}
                  {title.chapters !== undefined && (
                    <div>
                      <div className="text-2xl font-bold text-black">
                        {title.chapters}
                      </div>
                      <div className="text-sm text-gray-500">Chapters</div>
                    </div>
                  )}
                  {title.rating_count !== undefined && (
                    <div>
                      <div className="text-2xl font-bold text-black">
                        {titlesService.formatNumber(title.rating_count)}
                      </div>
                      <div className="text-sm text-gray-500">Ratings</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Synopsis */}
            {title.synopsis && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-black mb-3">Synopsis</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {title.synopsis}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Author Info */}
            {title.author && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-black mb-3">Credits</h2>
                  <div className="space-y-2 text-gray-700">
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
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-black mb-3">Tags</h2>
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

            {/* Tier-Gated Pitch Deck with PDF Viewer */}
            {title.pitch && title.pitch.trim() !== '' && (
              <TierGatedContent requiredTier="pro">
                <Card className="border-pro-purple/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5 text-pro-purple" />
                      <h2 className="text-lg font-bold text-black">Pitch Deck</h2>
                      <span className="ml-auto px-2 py-0.5 bg-pro-purple/10 text-pro-purple text-xs font-semibold rounded-full">
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
                      className="mb-4"
                      alt={`${title.title_name_en || title.title_name_kr} pitch deck preview`}
                    />
                  </CardContent>
                </Card>
              </TierGatedContent>
            )}
          </div>
        </div>

        {/* KStoryBridge Analysis Section - Full Width */}
        {pitchAnalysis && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10 lg:mt-12">
            <h2 className="text-2xl font-bold text-black mb-6">KStoryBridge Analysis</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Story World Card */}
              {pitchAnalysis.story_world && (
                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
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
                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
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
                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
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
                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xl font-semibold text-black mb-4">Story Elements</h3>
                    <div className="space-y-3 text-gray-700">
                      {pitchAnalysis.story_elements.logline && (
                        <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded-r-lg">
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
                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
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
                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
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
                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
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
                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
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
                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
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
                <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
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

        {/* External Link - Back in main grid */}
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1"></div>
            <div className="lg:col-span-2">
              {title.title_url && (
                <Card>
                  <CardContent className="p-6">
                    <Button
                      variant="outline"
                      onClick={() => window.open(title.title_url, '_blank')}
                      className="w-full border-gray-300"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original Source
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

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
