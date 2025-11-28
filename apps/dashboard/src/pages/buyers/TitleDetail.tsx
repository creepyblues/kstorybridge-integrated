import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title } from '@/services/titlesService';
import { type PitchAnalysis } from '@/types/pitchAnalysis';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { useTierAccess } from '@/contexts/TierContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, LayoutGrid, BookOpen, BarChart3, FolderOpen, Users } from 'lucide-react';

// Import new title detail components
import {
  TitleHero,
  OverviewTab,
  StoryDetailsTab,
  PlatformDataTab,
  MaterialsTab,
  CreditsTab,
  AIAnalysisSection,
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

  useEffect(() => {
    const fetchTitle = async () => {
      if (!titleId) return;

      setLoading(true);
      try {
        const data = await titlesService.getTitleById(titleId);
        setTitle(data);

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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 overflow-x-hidden">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/buyers/titles')}
          className="text-gray-600 hover:text-gray-900 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Titles
        </Button>

        {/* Hero Section */}
        <TitleHero
          title={title}
          isFavorited={isFavorited}
          favoriteLoading={favoriteLoading}
          onFavoriteToggle={handleFavoriteToggle}
        />

        {/* Divider */}
        <div className="py-2">
          <hr className="border-gray-200" />
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none h-auto p-0 gap-0">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#4C9C9B] data-[state=active]:text-[#4C9C9B] data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>

            {hasStoryDetails && (
              <TabsTrigger
                value="story"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#4C9C9B] data-[state=active]:text-[#4C9C9B] data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Story Details
              </TabsTrigger>
            )}

            {hasPlatformData && (
              <TabsTrigger
                value="platforms"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#4C9C9B] data-[state=active]:text-[#4C9C9B] data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Platform Data
              </TabsTrigger>
            )}

            {hasMaterials && (
              <TabsTrigger
                value="materials"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#4C9C9B] data-[state=active]:text-[#4C9C9B] data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Materials
              </TabsTrigger>
            )}

            {hasCredits && (
              <TabsTrigger
                value="credits"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#4C9C9B] data-[state=active]:text-[#4C9C9B] data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
              >
                <Users className="w-4 h-4 mr-2" />
                Credits
              </TabsTrigger>
            )}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview" className="mt-0">
              <OverviewTab title={title} />
            </TabsContent>

            {hasStoryDetails && (
              <TabsContent value="story" className="mt-0">
                <StoryDetailsTab title={title} />
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
                <CreditsTab title={title} />
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* AI Analysis Section - Collapsible at bottom */}
        {pitchAnalysis && (
          <AIAnalysisSection
            pitchAnalysis={pitchAnalysis}
            processingConfidence={title.processing_confidence}
          />
        )}
      </div>
    </BuyerLayout>
  );
}
