/**
 * UnifiedTitleDetailPage
 *
 * Authenticated buyer title detail at /buyers/titles/:titleId.
 * Uses UnifiedTitleDetail wrapped in BuyerLayout (sidebar).
 * Fetches by titleId (UUID) from titles table.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTierAccess } from '@/contexts/TierContext';
import { titlesService, type Title } from '@/services/titlesService';
import { type PitchAnalysis } from '@/types/pitchAnalysis';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { UnifiedTitleDetail } from '@/components/unified-title-detail';
import { trackTitleDetailView, trackFavorite, trackFeatureUsage } from '@/utils/analytics';

export default function UnifiedTitleDetailPage() {
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

  const location = useLocation();
  const hasTrackedView = useRef(false);

  const getViewSource = (): 'search' | 'chat' | 'comps' | 'saved' | 'featured' | 'direct' => {
    const state = location.state as { from?: string } | null;
    if (state?.from === 'chat') return 'chat';
    if (state?.from === 'comps') return 'comps';
    if (state?.from === 'saved') return 'saved';
    if (state?.from === 'featured') return 'featured';
    if (state?.from === 'search') return 'search';
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

        if (data?.pitch_analysis) {
          setPitchAnalysis(data.pitch_analysis);
        } else {
          setPitchAnalysis(null);
        }

        if (data && user?.id) {
          const favorited = await titlesService.isFavorited(titleId, user.id);
          setIsFavorited(favorited);
        }
      } catch (error: unknown) {
        console.error('Error fetching title:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch title details';
        toast({ title: 'Error', description: message, variant: 'destructive' });
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
        toast({ title: 'Removed from favorites', description: 'Title removed from your saved list' });
      } else {
        await titlesService.addFavorite(title.title_id, user.id);
        setIsFavorited(true);
        trackFavorite('add', title.title_id, title.title_name_en || title.title_name_kr || 'Unknown', 'detail');
        toast({ title: 'Added to favorites', description: 'Title saved to your list' });
      }
    } catch (error: unknown) {
      console.error('Error toggling favorite:', error);
      const message = error instanceof Error ? error.message : 'Failed to update favorites';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setFavoriteLoading(false);
    }
  };

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
      <UnifiedTitleDetail
        title={title}
        authState="authenticated"
        user={user}
        tier={tier}
        pitchAnalysis={pitchAnalysis}
        isFavorited={isFavorited}
        favoriteLoading={favoriteLoading}
        onFavoriteToggle={handleFavoriteToggle}
      />
    </BuyerLayout>
  );
}
