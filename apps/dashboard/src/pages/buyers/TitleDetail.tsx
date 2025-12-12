import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title } from '@/services/titlesService';
import { type PitchAnalysis } from '@/types/pitchAnalysis';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { useTierAccess } from '@/contexts/TierContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@iconify/react';
import { Card } from '@/components/ui/card';
import { trackTitleDetailView, trackFavorite, trackFeatureUsage } from '@/utils/analytics';

// Import new title detail components
import {
  TitleHero,
  OverviewTab,
  StoryDetailsTab,
  PlatformDataTab,
  MaterialsTab,
  CreditsTab,
} from '@/components/title-detail';

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
  const [activeTab, setActiveTab] = useState('overview');

  const location = useLocation();
  const hasTrackedView = useRef(false);

  // Determine source from navigation state or referrer
  const getViewSource = (): 'search' | 'chat' | 'comps' | 'saved' | 'featured' | 'direct' => {
    const state = location.state as { from?: string } | null;
    if (state?.from === 'chat') return 'chat';
    if (state?.from === 'comps') return 'comps';
    if (state?.from === 'saved') return 'saved';
    if (state?.from === 'featured') return 'featured';
    if (state?.from === 'search') return 'search';
    // Check referrer path
    const referrer = document.referrer;
    if (referrer.includes('/buyers/chat')) return 'chat';
    if (referrer.includes('/buyers/comps')) return 'comps';
    if (referrer.includes('/buyers/saved')) return 'saved';
    if (referrer.includes('/buyers/titles')) return 'search';
    return 'direct';
  };

  useEffect(() => {
    const fetchTitle = async () => {
      if (!titleId) return;

      setLoading(true);
      try {
        const data = await titlesService.getTitleById(titleId);
        setTitle(data);

        // Track title detail view (once per page load)
        if (data && !hasTrackedView.current) {
          hasTrackedView.current = true;
          const source = getViewSource();
          trackTitleDetailView(data.title_id, data.title_name_en || data.title_name_kr || 'Unknown', source, {
            genre: data.genre?.join(','),
            content_format: data.content_format,
            has_pitch: !!data.pitch,
          });
          trackFeatureUsage('title_detail_view');
        }

        // Extract pitch_analysis if available
        console.log('[TitleDetail] Title data received:', {
          title_id: data?.title_id,
          has_pitch: !!data?.pitch,
          has_pitch_analysis: !!data?.pitch_analysis,
          processing_confidence: data?.processing_confidence,
          has_platforms: !!data?.platforms?.length,
          has_documents: !!data?.documents?.length,
        });

        if (data?.pitch_analysis) {
          console.log('[TitleDetail] Setting pitch_analysis - confidence:', data.processing_confidence);
          setPitchAnalysis(data.pitch_analysis);
        } else {
          console.log('[TitleDetail] No pitch_analysis data available');
          setPitchAnalysis(null);
        }

        // Check if favorited
        if (data && user?.id) {
          const favorited = await titlesService.isFavorited(titleId, user.id);
          setIsFavorited(favorited);
        }
      } catch (error: unknown) {
        console.error('Error fetching title:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch title details';
        toast({
          title: 'Error',
          description: message,
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
        trackFavorite('remove', title.title_id, title.title_name_en || title.title_name_kr || 'Unknown', 'detail');
        toast({
          title: 'Removed from favorites',
          description: 'Title removed from your saved list',
        });
      } else {
        await titlesService.addFavorite(title.title_id, user.id);
        setIsFavorited(true);
        trackFavorite('add', title.title_id, title.title_name_en || title.title_name_kr || 'Unknown', 'detail');
        toast({
          title: 'Added to favorites',
          description: 'Title saved to your list',
        });
      }
    } catch (error: unknown) {
      console.error('Error toggling favorite:', error);
      const message = error instanceof Error ? error.message : 'Failed to update favorites';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Check if tabs have content to determine which to show
  const hasStoryDetails =
    title?.description_kr ||
    title?.tone ||
    title?.important_issues ||
    title?.setting_description ||
    title?.world_lore ||
    title?.supernatural_concepts ||
    title?.inspiration ||
    (title?.character_details && title.character_details.length > 0) ||
    title?.story_structure ||
    title?.narrative_arc ||
    title?.planned_ending;

  const hasPlatformData =
    (title?.platforms && title.platforms.length > 0) ||
    title?.views != null ||
    title?.likes != null ||
    title?.rating != null;

  const hasMaterials =
    (title?.pitch && title.pitch.trim() !== '') ||
    (title?.documents && title.documents.length > 0);

  const hasCredits =
    title?.story_author ||
    title?.art_author ||
    title?.original_author ||
    title?.underlying_novel_en ||
    title?.underlying_novel_kr ||
    title?.creator_achievements;

  if (loading) {
    return (
      <BuyerLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-gray-400" />
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
            <Icon icon="solar:arrow-left-bold-duotone" className="h-4 w-4 mr-2" />
            Back to Titles
          </Button>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 overflow-x-hidden">
        {/* Hero Section */}
        <TitleHero
          title={title}
          isFavorited={isFavorited}
          favoriteLoading={favoriteLoading}
          onFavoriteToggle={handleFavoriteToggle}
        />

        {/* AI Tagline Bubble - Standout Design */}
        {title.tagline && (
          <div className="flex gap-4 items-start p-5 bg-gradient-to-r from-hanok-teal/5 to-transparent border border-hanok-teal/20 rounded-2xl">
            {/* AI Avatar */}
            <div className="flex-shrink-0">
              <div className="bg-hanok-teal rounded-full p-2.5 shadow-md">
                <Icon icon="solar:chat-square-bold-duotone" className="h-5 w-5 text-white" />
              </div>
            </div>
            {/* Chat Bubble */}
            <div className="flex-1">
              <Card className="p-4 bg-white border-gray-200 shadow-sm">
                <p className="text-base text-gray-800 leading-relaxed">"{title.tagline}"</p>
              </Card>
            </div>
          </div>
        )}

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none h-auto p-0 gap-0">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#4C9C9B] data-[state=active]:text-[#4C9C9B] data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
            >
              <Icon icon="solar:widget-bold-duotone" className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>

            {hasStoryDetails && (
              <TabsTrigger
                value="story"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#4C9C9B] data-[state=active]:text-[#4C9C9B] data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
              >
                <Icon icon="solar:book-bold-duotone" className="w-4 h-4 mr-2" />
                Story Details
              </TabsTrigger>
            )}

            {hasPlatformData && (
              <TabsTrigger
                value="platforms"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#4C9C9B] data-[state=active]:text-[#4C9C9B] data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
              >
                <Icon icon="solar:chart-bold-duotone" className="w-4 h-4 mr-2" />
                Platform Data
              </TabsTrigger>
            )}

            {hasMaterials && (
              <TabsTrigger
                value="materials"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#4C9C9B] data-[state=active]:text-[#4C9C9B] data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
              >
                <Icon icon="solar:folder-bold-duotone" className="w-4 h-4 mr-2" />
                Materials
              </TabsTrigger>
            )}

            {hasCredits && (
              <TabsTrigger
                value="credits"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#4C9C9B] data-[state=active]:text-[#4C9C9B] data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
              >
                <Icon icon="solar:users-group-rounded-bold-duotone" className="w-4 h-4 mr-2" />
                Credits
              </TabsTrigger>
            )}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview" className="mt-0">
              <OverviewTab title={title} pitchAnalysis={pitchAnalysis} userTier={tier} />
            </TabsContent>

            {hasStoryDetails && (
              <TabsContent value="story" className="mt-0">
                <StoryDetailsTab title={title} pitchAnalysis={pitchAnalysis} />
              </TabsContent>
            )}

            {hasPlatformData && (
              <TabsContent value="platforms" className="mt-0">
                <PlatformDataTab title={title} />
              </TabsContent>
            )}

            {hasMaterials && (
              <TabsContent value="materials" className="mt-0">
                <MaterialsTab title={title} userTier={tier} />
              </TabsContent>
            )}

            {hasCredits && (
              <TabsContent value="credits" className="mt-0">
                <CreditsTab title={title} pitchAnalysis={pitchAnalysis} />
              </TabsContent>
            )}
          </div>
        </Tabs>

      </div>
    </BuyerLayout>
  );
}
