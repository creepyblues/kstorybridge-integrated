/**
 * PublicTitleDetailPage
 *
 * Public title detail page at /titles/:slug — no auth required.
 * Auth-aware: anonymous users see gated content with signup CTAs,
 * logged-in producers see full analysis (comps, format fit, rights).
 *
 * Hero section design matches apps/website/src/pages/PublicTitlePage.tsx.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Star, BookOpen, CheckCircle, Lock, Film, Tv, Smartphone, Mic, Sparkles } from 'lucide-react';
import { CompsAnalysisCard } from '@/components/title-detail/CompsAnalysisCard';
import { FormatFitDetailPanel } from '@/components/format-fit/FormatFitDetailPanel';
import { type SuggestedComp } from '@/services/compsGeneratorService';

const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://kstorybridge.com';

type PublicTitle = {
  title_id: string;
  title_name_en: string | null;
  title_name_kr: string;
  slug: string | null;
  title_image: string | null;
  tagline: string | null;
  synopsis: string | null;
  genre: string[] | string | null;
  content_format: string | null;
  comps: string[] | null;
  views: number | null;
  rating: number | null;
  rating_count: number | null;
  chapters: number | null;
  completed: boolean | null;
  rights_available: string[] | null;
  note: string | null;
  story_author: string | null;
  art_author: string | null;
  tone: string | null;
  audience: string | null;
  age_rating: string | null;
};

type AuthenticatedTitle = PublicTitle & {
  comps_analysis?: SuggestedComp[] | null;
  rights_holder_name?: string | null;
  rights_holder_company?: string | null;
};

const formatLabel = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const FORMAT_LABELS = [
  { key: 'film', label: 'Film', icon: Film },
  { key: 'tv_series', label: 'TV Series', icon: Tv },
  { key: 'animation', label: 'Animation', icon: Sparkles },
  { key: 'microdrama', label: 'Microdrama', icon: Smartphone },
  { key: 'audio_drama', label: 'Audio Drama', icon: Mic },
];

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

export default function PublicTitleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState<AuthenticatedTitle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!user;

  useEffect(() => {
    if (!slug) return;
    if (authLoading) return; // wait for auth state to resolve
    loadTitle(slug);
  }, [slug, authLoading, isLoggedIn]);

  const loadTitle = async (s: string) => {
    try {
      setLoading(true);

      if (isLoggedIn) {
        // Authenticated: fetch from titles table with full data
        // Cast to bypass auto-generated types (slug not in generated types)
        const query = supabase
          .from('titles' as any)
          .select('*') as any;
        const { data, error: fetchError } = await query
          .eq('slug', s)
          .single() as { data: AuthenticatedTitle | null; error: any };

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Not found');
        setTitle(data);
      } else {
        // Anonymous: fetch from public_titles view
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
    if (title && slug) {
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

  const signupUrl = '/signup';

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

  const genres = title.genre
    ? (Array.isArray(title.genre) ? title.genre : [title.genre])
    : [];

  const compsAnalysis = (title as AuthenticatedTitle).comps_analysis;
  const hasCompsAnalysis = compsAnalysis && compsAnalysis.length > 0;

  return (
    <PublicLayout isLoggedIn={isLoggedIn} user={user}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero Section — matches PublicTitlePage.tsx design exactly */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Cover Image */}
          <div className="md:col-span-2">
            {title.title_image ? (
              <img
                src={title.title_image}
                alt={title.title_name_en || title.title_name_kr}
                className="w-full rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
          </div>

          {/* Title Info */}
          <div className="md:col-span-3 flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
              {title.title_name_en || title.title_name_kr}
            </h1>
            {title.title_name_en && title.title_name_kr && (
              <p className="text-lg text-gray-500 mb-4">{title.title_name_kr}</p>
            )}

            {title.story_author && (
              <p className="text-gray-600 mb-4">
                <span className="font-medium">Story</span> {title.story_author}
                {title.art_author && title.art_author !== title.story_author && (
                  <> &middot; <span className="font-medium">Art</span> {title.art_author}</>
                )}
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-5">
              {genres.map(g => (
                <Badge key={g} variant="outline" className="border-gray-300 text-gray-700">
                  {formatLabel(g)}
                </Badge>
              ))}
              {title.content_format && (
                <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-50">
                  {formatLabel(title.content_format)}
                </Badge>
              )}
              {title.age_rating && (
                <Badge variant="outline" className="border-gray-300 text-gray-600">
                  {title.age_rating}
                </Badge>
              )}
            </div>

            {/* Comp line */}
            {title.comps && title.comps.length >= 2 && (
              <p className="text-gray-700 italic mb-5">
                Think: {title.comps.slice(0, 3).join(' meets ')}
              </p>
            )}

            {/* Metrics */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
              {title.views != null && title.views > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> {title.views.toLocaleString()} views
                </span>
              )}
              {title.rating != null && title.rating_count != null && title.rating_count > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4" /> {title.rating.toFixed(1)} ({title.rating_count.toLocaleString()})
                </span>
              )}
              {title.chapters != null && title.chapters > 0 && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> {title.chapters} chapters
                  {title.completed && ' (Complete)'}
                </span>
              )}
            </div>

            {/* Rights badges */}
            {title.rights_available && title.rights_available.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {title.rights_available.map(r => (
                  <Badge key={r} className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> {formatLabel(r)}
                  </Badge>
                ))}
              </div>
            )}

            {title.tagline && (
              <p className="text-lg text-gray-800 font-medium mb-6">"{title.tagline}"</p>
            )}

            {/* Primary CTA */}
            {isLoggedIn ? (
              <div className="flex gap-3">
                <Link to="/buyers/home">
                  <Button className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <Link to={signupUrl} onClick={() => handleCtaClick('hero')}>
                  <Button className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium">
                    Unlock Full Analysis — Free for Producers
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 mt-2">
                  <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
                  Free for producers &middot; Takes 30 seconds
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Synopsis */}
        {title.synopsis && (
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-black">Synopsis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{title.synopsis}</p>
            </CardContent>
          </Card>
        )}

        {/* Editorial Take */}
        {title.note && (
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-black">Editorial Take</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed italic">{title.note}</p>
            </CardContent>
          </Card>
        )}

        {/* Adaptation Intelligence */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-black">Adaptation Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoggedIn && hasCompsAnalysis ? (
              <CompsAnalysisCard compsAnalysis={compsAnalysis!} showTitle={false} />
            ) : isLoggedIn && !hasCompsAnalysis ? (
              <div className="text-center py-8 text-gray-500">
                <p className="font-medium mb-1">Coming Soon</p>
                <p className="text-sm">Comp analysis is being generated for this title.</p>
              </div>
            ) : (
              /* Anonymous: static placeholder + blurred locked cards */
              <div>
                {/* One visible static comp card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                  <div className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                      <Film className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-medium text-sm text-black truncate">To All the Boys I've Loved Before</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">88% match</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">Strong YA romance with cross-cultural appeal</p>
                  </div>

                  {/* 4 blurred locked cards */}
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white relative overflow-hidden">
                      <div className="blur-sm pointer-events-none">
                        <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <Link to={signupUrl} onClick={() => handleCtaClick('comps')}>
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-100 rounded-full px-6">
                      Unlock All Comparables — Free
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Format Fit */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-black">Format Suitability</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoggedIn ? (
              <FormatFitDetailPanel titleId={title.title_id} />
            ) : (
              /* Anonymous: blurred format bars */
              <div className="space-y-4">
                {FORMAT_LABELS.map(f => (
                  <div key={f.key} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32 flex-shrink-0">
                      <f.icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{f.label}</span>
                    </div>
                    <div className="flex-1 relative">
                      <div className="h-6 bg-gray-100 rounded-full overflow-hidden blur-sm">
                        <div
                          className="h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                          style={{ width: `${40 + Math.random() * 40}%` }}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-end pr-2">
                        <Lock className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-center mt-4">
                  <Link to={signupUrl} onClick={() => handleCtaClick('format_fit')}>
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-100 rounded-full px-6">
                      Unlock Format Scores — Free
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rights Info */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-black">Rights Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoggedIn ? (
              <div className="space-y-4">
                {title.rights_available && title.rights_available.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Available Formats</p>
                    <div className="flex flex-wrap gap-2">
                      {title.rights_available.map(r => (
                        <Badge key={r} className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> {formatLabel(r)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {((title as AuthenticatedTitle).rights_holder_name || (title as AuthenticatedTitle).rights_holder_company) && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Rights Holder</p>
                    <p className="text-gray-800">
                      {(title as AuthenticatedTitle).rights_holder_name}
                      {(title as AuthenticatedTitle).rights_holder_company && (
                        <span className="text-gray-500"> &middot; {(title as AuthenticatedTitle).rights_holder_company}</span>
                      )}
                    </p>
                  </div>
                )}
                <a href="mailto:contact@kstorybridge.com">
                  <Button className="bg-black hover:bg-gray-800 text-white rounded-full px-6 mt-2">
                    Contact for Licensing
                  </Button>
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> Rights Verified
                  </Badge>
                </div>
                <div className="flex items-center gap-3 blur-sm pointer-events-none">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                </div>
                <Button disabled className="rounded-full px-6 opacity-50">
                  <Lock className="h-3.5 w-3.5 mr-2" /> Contact for Licensing
                </Button>
                <p className="text-xs text-gray-500">Sign up to view rights holder details and contact information.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom CTA (anonymous only) */}
        {!isLoggedIn && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 sm:p-10 text-center mb-12">
            <h3 className="text-xl font-semibold text-black mb-3">
              You are 30 seconds away from the full picture on this title.
            </h3>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              Free for producers &middot; Always
            </p>
            <Link to={signupUrl} onClick={() => handleCtaClick('bottom')}>
              <Button className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium">
                Unlock Full Analysis — Free
              </Button>
            </Link>
          </div>
        )}
      </main>

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
      {/* Minimal top nav */}
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
