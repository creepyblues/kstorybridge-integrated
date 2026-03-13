import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { Badge } from '@kstorybridge/ui';
import { Button } from '@kstorybridge/ui';
import { Eye, Star, BookOpen, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import UniversalHeader from '../components/UniversalHeader';
import Footer from '../components/Footer';

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

const formatLabel = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function PublicTitlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [title, setTitle] = useState<PublicTitle | null>(null);
  const [similar, setSimilar] = useState<SimilarTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) loadTitle(slug);
  }, [slug]);

  const loadTitle = async (s: string) => {
    try {
      setLoading(true);
      // slug column added via migration — cast to bypass auto-generated types
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

            {/* Primary CTA */}
            <Button
              className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium"
              onClick={() => { window.location.href = signupUrl; }}
            >
              Express Interest &mdash; It's Free
            </Button>
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

        {/* Gate CTA */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 sm:p-10 text-center mb-12">
          <h3 className="text-xl font-semibold text-black mb-3">
            You're one step away from connecting with this title.
          </h3>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            KStoryBridge verifies rights availability and shepherds dealmaking &mdash; free for producers.
          </p>
          <Button
            className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium"
            onClick={() => { window.location.href = signupUrl; }}
          >
            Get Access &mdash; It's Free
          </Button>
        </div>

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
