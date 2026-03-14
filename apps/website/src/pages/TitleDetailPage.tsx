import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import UniversalHeader from '../components/UniversalHeader';

/**
 * Legacy route: /title/:titleId (UUID-based)
 * Looks up the slug and redirects to /titles/:slug (the new public page).
 * Falls back to rendering the old page content if slug lookup fails.
 */
export default function TitleDetailPage() {
  const { titleId } = useParams<{ titleId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!titleId) return;

    (async () => {
      try {
        const { data } = await (supabase
          .from('public_titles' as any)
          .select('slug')
          .eq('title_id', titleId)
          .single()) as { data: { slug: string | null } | null; error: any };

        if (data?.slug) {
          navigate(`/titles/${data.slug}`, { replace: true });
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    })();
  }, [titleId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <UniversalHeader />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Title Not Found</h1>
          <p className="text-gray-500">This title may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <UniversalHeader />
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-500">
        Redirecting...
      </div>
    </div>
  );
}
