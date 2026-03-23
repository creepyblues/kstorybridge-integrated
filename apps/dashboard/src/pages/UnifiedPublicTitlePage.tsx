/**
 * UnifiedPublicTitlePage
 *
 * Public title detail at /titles/:slug — no auth required, auth-aware.
 * Uses UnifiedTitleDetail with PublicLayout (minimal header, no sidebar).
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UnifiedTitleDetail, type PublicTitle } from '@/components/unified-title-detail';
import { type Title } from '@/services/titlesService';

const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://kstorybridge.com';

// GA4 event helper
function trackPublicTitleEvent(eventName: string, params: Record<string, string>) {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, { ...params, app_section: 'public_title' });
    }
  } catch {
    // silent
  }
}

export default function UnifiedPublicTitlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();

  const navigate = useNavigate();

  const [title, setTitle] = useState<PublicTitle | Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasTracked = useRef(false);

  const isLoggedIn = !!user;

  useEffect(() => {
    if (!slug) return;
    if (authLoading) return;
    loadTitle(slug);
  }, [slug, authLoading, isLoggedIn]);

  const loadTitle = async (s: string) => {
    try {
      setLoading(true);

      if (isLoggedIn) {
        // Redirect logged-in users to dashboard title page with sidebar
        navigate(`/buyers/titles/${s}`, { replace: true });
        return;
      } else {
        const query = supabase
          .from('public_titles' as any)
          .select('title_id, title_name_en, title_name_kr, slug, title_image, tagline, synopsis, genre, content_format, comps, views, rating, rating_count, chapters, completed, rights_available, note, story_author, art_author, tone, audience, age_rating') as any;
        const { data, error: fetchError } = await query
          .eq('slug', s)
          .single() as { data: PublicTitle | null; error: any };

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Not found');
        setTitle(data);
      }
    } catch {
      setError('Title not found');
    } finally {
      setLoading(false);
    }
  };

  // Track page view
  useEffect(() => {
    if (title && slug && !hasTracked.current) {
      hasTracked.current = true;
      trackPublicTitleEvent('title_page_view', {
        title_slug: slug,
        user_state: isLoggedIn ? 'authenticated' : 'anonymous',
      });
    }
  }, [title?.title_id]);

  const handleCtaClick = (position: string) => {
    trackPublicTitleEvent('title_cta_clicked', {
      title_slug: slug || '',
      cta_position: position,
      user_state: isLoggedIn ? 'authenticated' : 'anonymous',
    });
  };

  if (loading || authLoading) {
    return (
      <PublicLayout isLoggedIn={false} user={null}>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-500">Loading...</div>
      </PublicLayout>
    );
  }

  if (error || !title) {
    return (
      <PublicLayout isLoggedIn={false} user={null}>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Title Not Found</h1>
          <p className="text-gray-500">This title may have been removed or the link is invalid.</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout isLoggedIn={isLoggedIn} user={user}>
      <UnifiedTitleDetail
        title={title}
        authState={isLoggedIn ? 'authenticated' : 'anon'}
        user={user}
        onCtaClick={handleCtaClick}
      />

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <a href={WEBSITE_URL} className="hover:text-gray-700">
              &copy; {new Date().getFullYear()} KStoryBridge
            </a>
            <div className="flex gap-6">
              <a href={`${WEBSITE_URL}/about`} className="hover:text-gray-700">About</a>
              <a href={`${WEBSITE_URL}/privacy`} className="hover:text-gray-700">Privacy</a>
              <a href={`${WEBSITE_URL}/terms`} className="hover:text-gray-700">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </PublicLayout>
  );
}

/** Standalone layout — no sidebar, minimal top nav */
function PublicLayout({
  children,
  isLoggedIn,
  user,
}: {
  children: React.ReactNode;
  isLoggedIn: boolean;
  user: any;
}) {
  const websiteUrl = WEBSITE_URL;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <a href={websiteUrl} className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-bold">
                <span className="text-black">K</span>
                <span className="text-hanok-teal">Story</span>
                <span className="text-black">Bridge</span>
              </h1>
            </a>

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    {user?.email}
                  </span>
                  <Link to="/buyers/home">
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-100 rounded-full text-sm">
                      Go to Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/signin">
                  <Button variant="outline" className="border-gray-300 hover:bg-gray-100 rounded-full text-sm">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
