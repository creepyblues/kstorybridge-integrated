/**
 * TrialTitleDetail Page
 *
 * Public title detail page for trial users.
 * Shows full title info without auth, with a signup CTA banner.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title } from '@/services/titlesService';
import { type PitchAnalysis } from '@/types/pitchAnalysis';
import { TrialLayout } from '@/components/layout/TrialLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@iconify/react';
import { Card } from '@/components/ui/card';

import {
  TitleHero,
  OverviewTab,
  StoryDetailsTab,
  CreditsTab,
} from '@/components/title-detail';

export default function TrialTitleDetail() {
  const { titleId } = useParams<{ titleId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [pitchAnalysis, setPitchAnalysis] = useState<PitchAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchTitle = async () => {
      if (!titleId) return;

      setLoading(true);
      try {
        const data = await titlesService.getTitleById(titleId);
        setTitle(data);

        if (data?.pitch_analysis) {
          setPitchAnalysis(data.pitch_analysis);
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
  }, [titleId, toast]);

  // Check if tabs have content
  const hasStoryDetails =
    title?.synopsis_kr ||
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

  const hasCredits =
    title?.story_author ||
    title?.art_author ||
    title?.original_author ||
    title?.underlying_novel_en ||
    title?.underlying_novel_kr ||
    title?.creator_achievements;

  if (loading) {
    return (
      <TrialLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
          <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </TrialLayout>
    );
  }

  if (!title) {
    return (
      <TrialLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]">
          <p className="text-gray-500 text-lg mb-4">Title not found</p>
          <Button variant="outline" onClick={() => navigate('/trial')}>
            <Icon icon="solar:arrow-left-bold-duotone" className="h-4 w-4 mr-2" />
            Back to Trial
          </Button>
        </div>
      </TrialLayout>
    );
  }

  return (
    <TrialLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/trial')}
          className="text-gray-600 hover:text-gray-900"
        >
          <Icon icon="solar:arrow-left-bold-duotone" className="h-4 w-4 mr-2" />
          Back to Trial
        </Button>

        {/* Signup CTA Banner */}
        <div className="bg-gradient-to-r from-hanok-teal/10 to-purple-100/50 border border-hanok-teal/20 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-hanok-teal/10 rounded-full p-2">
              <Icon icon="solar:stars-bold-duotone" className="h-5 w-5 text-hanok-teal" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Want to save titles and get unlimited searches?</p>
              <p className="text-sm text-gray-600">Sign up free to unlock all features</p>
            </div>
          </div>
          <Link to="/signup">
            <Button className="bg-hanok-teal hover:bg-hanok-teal/90 text-white whitespace-nowrap">
              Sign Up Free
            </Button>
          </Link>
        </div>

        {/* Hero Section - without favorite button */}
        <TitleHero
          title={title}
          isFavorited={false}
          favoriteLoading={false}
          onFavoriteToggle={() => {
            toast({
              title: 'Sign up to save',
              description: 'Create a free account to save your favorite titles',
            });
          }}
        />

        {/* AI Tagline */}
        {title.tagline && (
          <div className="flex gap-4 items-start p-5 bg-gradient-to-r from-hanok-teal/5 to-transparent border border-hanok-teal/20 rounded-2xl">
            <div className="flex-shrink-0">
              <div className="bg-hanok-teal rounded-full p-2.5 shadow-md">
                <Icon icon="solar:chat-square-bold-duotone" className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <Card className="p-4 bg-white border-gray-200 shadow-sm">
                <p className="text-base text-gray-800 leading-relaxed">"{title.tagline}"</p>
              </Card>
            </div>
          </div>
        )}

        {/* Tabbed Content - Trial users see Overview, Story, Platform, Credits (no Materials for non-auth) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none h-auto p-0 gap-0">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-hanok-teal data-[state=active]:text-hanok-teal data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
            >
              <Icon icon="solar:square-arrow-right-up-bold-duotone" className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>

            {hasStoryDetails && (
              <TabsTrigger
                value="story"
                className="data-[state=active]:border-b-2 data-[state=active]:border-hanok-teal data-[state=active]:text-hanok-teal data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
              >
                <Icon icon="solar:book-bold-duotone" className="w-4 h-4 mr-2" />
                Story Details
              </TabsTrigger>
            )}

            {hasCredits && (
              <TabsTrigger
                value="credits"
                className="data-[state=active]:border-b-2 data-[state=active]:border-hanok-teal data-[state=active]:text-hanok-teal data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
              >
                <Icon icon="solar:user-bold-duotone" className="w-4 h-4 mr-2" />
                Credits
              </TabsTrigger>
            )}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview" className="mt-0">
              <OverviewTab title={title} pitchAnalysis={pitchAnalysis} userTier="basic" />
            </TabsContent>

            {hasStoryDetails && (
              <TabsContent value="story" className="mt-0">
                <StoryDetailsTab title={title} pitchAnalysis={pitchAnalysis} />
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
    </TrialLayout>
  );
}
