import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { Badge } from '@kstorybridge/ui';
import { Button } from '@kstorybridge/ui';
import { Eye, Star, BookOpen, CheckCircle, Lock, ShieldCheck, Bookmark, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import UniversalHeader from '../components/UniversalHeader';
import Footer from '../components/Footer';
import { trackWebsiteEvent } from '../utils/analytics';
import type { User } from '@supabase/supabase-js';

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'https://dashboard.kstorybridge.com';

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

type SimilarTitle = {
  title_id: string;
  title_name_en: string | null;
  title_name_kr: string;
  slug: string | null;
  title_image: string | null;
  genre: string[] | string | null;
  content_format: string | null;
};

type SuggestedComp = {
  comp_title: string;
  comp_year?: number;
  comp_type: string;
  overall_match_score: number;
  explanation: string;
  match_reasons: string[];
  poster_url?: string;
  imdb_url?: string;
};

type FormatFitData = {
  film_score: number | null;
  tv_series_score: number | null;
  animation_score: number | null;
  microdrama_score: number | null;
  audio_drama_score: number | null;
};

type RightsData = {
  rights_holder_name: string | null;
  rights_holder_company: string | null;
  rights_available: string[] | null;
};

const FORMAT_LABELS: Record<string, string> = {
  film_score: 'Film',
  tv_series_score: 'TV Series',
  animation_score: 'Animation',
  microdrama_score: 'Microdrama',
  audio_drama_score: 'Audio Drama',
};

const formatLabel = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function getFitLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  return 'Fair';
}

function getFitColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  return 'bg-gray-400';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export default function PublicTitlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [title, setTitle] = useState<PublicTitle | null>(null);
  const [similar, setSimilar] = useState<SimilarTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Auth-gated data
  const [compsData, setCompsData] = useState<SuggestedComp[] | null>(null);
  const [formatFit, setFormatFit] = useState<FormatFitData | null>(null);
  const [rightsData, setRightsData] = useState<RightsData | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (slug) loadTitle(slug);
  }, [slug]);

  // Track page view
  useEffect(() => {
    if (title && slug) {
      trackWebsiteEvent('title_page_view', {
        title_slug: slug,
        user_state: user ? 'loggedin' : 'anonymous',
      });
    }
  }, [title, slug, user]);

  // Load auth-gated data when user is logged in and title is loaded
  useEffect(() => {
    if (user && title) {
      loadAuthData(title.title_id);
    }
  }, [user, title]);

  const loadTitle = async (s: string) => {
    try {
      setLoading(true);
      const query = supabase
        .from('public_titles' as any)
        .select('title_id, title_name_en, title_name_kr, slug, title_image, tagline, synopsis, genre, content_format, comps, views, rating, rating_count, chapters, completed, rights_available, note, story_author, art_author, tone, audience, age_rating') as any;
      const { data, error: fetchError } = await query
        .eq('slug', s)
        .single() as { data: PublicTitle | null; error: any };

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Not found');
      setTitle(data);

      // Load similar titles by genre
      if (data.genre) {
        const genres = Array.isArray(data.genre) ? data.genre : [data.genre];
        const { data: similarData } = await (supabase
          .from('public_titles' as any)
          .select('title_id, title_name_en, title_name_kr, slug, title_image, genre, content_format')
          .neq('title_id', data.title_id)
          .overlaps('genre', genres)
          .order('views', { ascending: false, nullsFirst: false })
          .limit(3)) as { data: SimilarTitle[] | null; error: any };
        if (similarData) setSimilar(similarData);
      }
    } catch {
      setError('Title not found');
    } finally {
      setLoading(false);
    }
  };

  const loadAuthData = async (titleId: string) => {
    // Fetch comps_analysis from titles table
    const { data: comps } = await db
      .from('titles')
      .select('comps_analysis, rights_holder_name, rights_holder_company, rights_available')
      .eq('title_id', titleId)
      .single();

    if (comps) {
      setCompsData((comps.comps_analysis as SuggestedComp[]) || null);
      setRightsData({
        rights_holder_name: comps.rights_holder_name,
        rights_holder_company: comps.rights_holder_company,
        rights_available: comps.rights_available,
      });
    }

    // Fetch format fit data
    const { data: fit } = await db
      .from('title_format_fit')
      .select('film_score, tv_series_score, animation_score, microdrama_score, audio_drama_score')
      .eq('title_id', titleId)
      .single();

    if (fit) {
      setFormatFit(fit as FormatFitData);
    }
  };

  const handleCtaClick = (position: 'hero' | 'bottom' | 'adaptation' | 'format_fit' | 'rights') => {
    trackWebsiteEvent('title_cta_clicked', {
      title_slug: slug,
      cta_position: position,
      user_state: user ? 'loggedin' : 'anonymous',
    });
    window.location.href = signupUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <UniversalHeader />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !title) {
    return (
      <div className="min-h-screen bg-white">
        <UniversalHeader />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Title Not Found</h1>
          <p className="text-gray-500">This title may have been removed or the link is invalid.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const genres = title.genre
    ? (Array.isArray(title.genre) ? title.genre : [title.genre])
    : [];

  const signupUrl = `${DASHBOARD_URL}/signup?title_redirect=${title.title_id}`;
  const dashboardTitleUrl = `${DASHBOARD_URL}/buyers/titles/${title.title_id}`;

  return (
    <div className="min-h-screen bg-white">
      <UniversalHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero Section */}
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

            {/* Rights */}
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

            {/* Primary CTA — auth-aware */}
            {user ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100 rounded-full px-6 py-3 text-base font-medium"
                  onClick={() => {
                    // Save title (bookmark) — for now navigate to dashboard
                    window.location.href = dashboardTitleUrl;
                  }}
                >
                  <Bookmark className="h-4 w-4 mr-2" /> Save
                </Button>
                <Button
                  className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium"
                  onClick={() => { window.location.href = dashboardTitleUrl; }}
                >
                  View in Dashboard <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div>
                <Button
                  className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium"
                  onClick={() => handleCtaClick('hero')}
                >
                  Unlock Full Analysis — Free for Producers
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  <CheckCircle className="h-3.5 w-3.5 inline mr-1 text-green-600" />
                  Free for producers · Takes 30 seconds
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

        {/* Editorial note */}
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

        {/* Section A: Adaptation Intelligence */}
        <AdaptationIntelligenceSection
          user={user}
          compsData={compsData}
          onCtaClick={() => handleCtaClick('adaptation')}
        />

        {/* Section B: Format Fit */}
        <FormatFitSection
          user={user}
          formatFit={formatFit}
          onCtaClick={() => handleCtaClick('format_fit')}
        />

        {/* Section C: Rights Info */}
        <RightsInfoSection
          user={user}
          rightsData={rightsData}
          rightsAvailable={title.rights_available}
          onCtaClick={() => handleCtaClick('rights')}
        />

        {/* Bottom CTA — anonymous only */}
        {!user && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 sm:p-10 text-center mb-12">
            <h3 className="text-xl font-semibold text-black mb-3">
              You are 30 seconds away from the full picture on this title.
            </h3>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              <CheckCircle className="h-4 w-4 inline mr-1 text-green-600" />
              Free for producers · Always
            </p>
            <Button
              className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium"
              onClick={() => handleCtaClick('bottom')}
            >
              Unlock Full Analysis — Free
            </Button>
          </div>
        )}

        {/* Similar Titles */}
        {similar.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-black mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {similar.map(t => (
                <a
                  key={t.title_id}
                  href={t.slug ? `/titles/${t.slug}` : `/title/${t.title_id}`}
                  className="group block"
                >
                  <div className="rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {t.title_image ? (
                      <img
                        src={t.title_image}
                        alt={t.title_name_en || t.title_name_kr}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No Image</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-medium text-black group-hover:text-gray-700 truncate">
                        {t.title_name_en || t.title_name_kr}
                      </h3>
                      {t.content_format && (
                        <p className="text-sm text-gray-500 mt-1">{formatLabel(t.content_format)}</p>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

/* ================================================================
   Section Components
   ================================================================ */

function AdaptationIntelligenceSection({
  user,
  compsData,
  onCtaClick,
}: {
  user: User | null;
  compsData: SuggestedComp[] | null;
  onCtaClick: () => void;
}) {
  if (user) {
    // Logged-in: show real comps or coming soon
    if (!compsData || compsData.length === 0) {
      return (
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-black">Adaptation Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-6">
              Comparable title analysis is coming soon for this title.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-black">Adaptation Intelligence</CardTitle>
          <p className="text-sm text-gray-500 mt-1">AI-matched to titles in active production mandates</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {compsData.slice(0, 5).map((comp, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 p-4 flex flex-col"
              >
                {comp.poster_url && (
                  <img
                    src={comp.poster_url}
                    alt={comp.comp_title}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-black text-sm leading-tight">
                    {comp.comp_title}
                    {comp.comp_year && (
                      <span className="text-gray-400 ml-1">({comp.comp_year})</span>
                    )}
                  </h4>
                  <Badge className="bg-black text-white text-xs shrink-0">
                    {comp.overall_match_score}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mb-1">{comp.comp_type}</p>
                {comp.match_reasons?.[0] && (
                  <p className="text-xs text-gray-600 mt-auto">
                    {comp.match_reasons[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Anonymous: teaser with one visible comp + blurred placeholders
  return (
    <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
      <CardHeader>
        <CardTitle className="text-xl text-black">Adaptation Intelligence</CardTitle>
        <p className="text-sm text-gray-500 mt-1">AI-matched to titles in active production mandates</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Static placeholder comp */}
          <div className="rounded-xl border border-gray-200 p-3">
            <div className="w-full h-32 bg-gradient-to-br from-pink-100 to-pink-50 rounded-lg mb-2 flex items-center justify-center">
              <span className="text-xs text-gray-400">Poster</span>
            </div>
            <h4 className="font-medium text-black text-sm leading-tight mb-1">
              To All the Boys I've Loved Before
            </h4>
            <Badge className="bg-black text-white text-xs">88%</Badge>
          </div>
          {/* Blurred placeholder cards */}
          {[1, 2, 3, 4].map(n => (
            <div
              key={n}
              className="rounded-xl border border-gray-200 p-3 relative select-none"
            >
              <div className="blur-sm pointer-events-none">
                <div className="w-full h-32 bg-gray-100 rounded-lg mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-5 bg-gray-200 rounded w-12" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Button
            className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium"
            onClick={onCtaClick}
          >
            Unlock Full Analysis — Free
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FormatFitSection({
  user,
  formatFit,
  onCtaClick,
}: {
  user: User | null;
  formatFit: FormatFitData | null;
  onCtaClick: () => void;
}) {
  const formatKeys = Object.keys(FORMAT_LABELS) as (keyof FormatFitData)[];

  if (user) {
    if (!formatFit) {
      return (
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-black">Format Fit Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-6">
              Format fit analysis is coming soon for this title.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-black">Format Fit Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formatKeys.map(key => {
              const score = formatFit[key];
              if (score == null) return null;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {FORMAT_LABELS[key]}
                    </span>
                    <span className="text-sm text-gray-500">
                      {score}% · {getFitLabel(score)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${getFitColor(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Anonymous: blurred format bars
  return (
    <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
      <CardHeader>
        <CardTitle className="text-xl text-black">Format Fit Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 relative">
          {Object.values(FORMAT_LABELS).map(label => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm text-gray-300 blur-sm select-none">85% · Excellent</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-gray-200 blur-sm" style={{ width: '70%' }} />
              </div>
            </div>
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Lock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Unlock to see scores and dimension breakdowns</p>
            </div>
          </div>
        </div>
        <div className="text-center mt-6">
          <Button
            className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium"
            onClick={onCtaClick}
          >
            Unlock Full Analysis — Free
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RightsInfoSection({
  user,
  rightsData,
  rightsAvailable,
  onCtaClick,
}: {
  user: User | null;
  rightsData: RightsData | null;
  rightsAvailable: string[] | null;
  onCtaClick: () => void;
}) {
  const hasRights = rightsAvailable && rightsAvailable.length > 0;

  if (user) {
    return (
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-black">Rights Info</CardTitle>
        </CardHeader>
        <CardContent>
          {hasRights && (
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">Rights Verified</span>
            </div>
          )}
          {rightsData?.rights_holder_name && (
            <p className="text-gray-700 mb-1">
              <span className="font-medium">Rights Holder:</span> {rightsData.rights_holder_name}
            </p>
          )}
          {rightsData?.rights_holder_company && (
            <p className="text-gray-700 mb-3">
              <span className="font-medium">Company:</span> {rightsData.rights_holder_company}
            </p>
          )}
          {hasRights && (
            <div className="flex flex-wrap gap-2 mb-4">
              {rightsAvailable!.map(r => (
                <Badge key={r} className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" /> {formatLabel(r)}
                </Badge>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            className="border-gray-300 hover:bg-gray-100 rounded-full px-6 py-2 text-sm font-medium"
            onClick={() => {
              window.location.href = 'mailto:contact@kstorybridge.com?subject=Licensing Inquiry';
            }}
          >
            Contact for Licensing
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Anonymous
  return (
    <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
      <CardHeader>
        <CardTitle className="text-xl text-black">Rights Info</CardTitle>
      </CardHeader>
      <CardContent>
        {hasRights && (
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <span className="text-green-700 font-medium">Rights Verified</span>
          </div>
        )}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-48 blur-sm" />
          <div className="h-4 bg-gray-200 rounded w-36 blur-sm" />
        </div>
        <Button
          variant="outline"
          className="border-gray-300 text-gray-400 rounded-full px-6 py-2 text-sm font-medium cursor-not-allowed"
          disabled
        >
          <Lock className="h-3.5 w-3.5 mr-1" /> Contact for Licensing
        </Button>
        <div className="mt-4">
          <Button
            className="bg-black hover:bg-gray-800 text-white rounded-full px-6 py-2 text-sm font-medium"
            onClick={onCtaClick}
          >
            Unlock Full Analysis — Free
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
