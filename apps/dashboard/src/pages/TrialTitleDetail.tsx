/**
 * TrialTitleDetail Page
 *
 * Public title detail for trial users. Reads the public-safe `public_titles`
 * view (NOT the raw titles table) and renders the same gated teaser view as the
 * public /titles/:slug page (UnifiedTitleDetail, authState="anon"), so premium
 * data (comps, format scores, rights, deep story analysis) is gated behind signup.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { TrialLayout } from '@/components/layout/TrialLayout';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { UnifiedTitleDetail, type PublicTitle } from '@/components/unified-title-detail';
import { trackTrialTitleDetailView, trackTrialSignupCtaClicked } from '@/utils/analytics';

const PUBLIC_TITLE_COLUMNS =
  'title_id, title_name_en, title_name_kr, slug, title_image, tagline, synopsis, genre, content_format, comps, views, rating, rating_count, chapters, completed, rights_available, note, story_author, art_author, tone, audience, age_rating';

export default function TrialTitleDetail() {
  const { titleId } = useParams<{ titleId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [title, setTitle] = useState<PublicTitle | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  // Source tool from URL params (set when navigating from result cards)
  const sourceTool = searchParams.get('source') as 'comps' | 'mandates' | 'chat' | null;

  useEffect(() => {
    const fetchTitle = async () => {
      if (!titleId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('public_titles' as any)
          .select(PUBLIC_TITLE_COLUMNS)
          .eq('title_id', titleId)
          .single() as { data: PublicTitle | null; error: any };

        if (error) throw error;
        setTitle(data);

        if (data && !hasTrackedView) {
          trackTrialTitleDetailView(
            titleId,
            data.title_name_en || data.title_name_kr || 'Unknown Title',
            sourceTool || 'comps',
          );
          setHasTrackedView(true);
        }
      } catch (err) {
        console.error('Error fetching title:', err);
        setTitle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTitle();
  }, [titleId, sourceTool, hasTrackedView]);

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
          <Link to="/signup" onClick={() => trackTrialSignupCtaClicked('title_detail_banner')}>
            <Button className="bg-hanok-teal hover:bg-hanok-teal/90 text-white whitespace-nowrap">
              Sign Up Free
            </Button>
          </Link>
        </div>

        {/* Gated title detail (same component as public /titles/:slug) */}
        <UnifiedTitleDetail
          title={title}
          authState="anon"
          user={null}
          onCtaClick={() => trackTrialSignupCtaClicked('title_detail_banner')}
        />
      </div>
    </TrialLayout>
  );
}
