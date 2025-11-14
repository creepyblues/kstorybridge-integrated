import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { LearningCard } from '@/components/LearningCard';
import { supabase } from '@/lib/supabase';

interface ContentPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  tags: string[] | null;
  author_name: string;
  published_at: string | null;
  category: string;
}

export default function LearningCenter() {
  const navigate = useNavigate();
  const { t } = useTranslation(['content', 'common']);
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('content_posts')
          .select('id, title, slug, excerpt, featured_image_url, tags, author_name, published_at, category')
          .eq('category', 'learning')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        if (error) throw error;

        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching learning posts:', err);
        setError('Failed to load learning materials. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">{t('content:learningCenter.title')}</h1>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('content:learningCenter.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Learning Materials Grid */}
        {!loading && !error && posts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {posts.map((post) => (
              <LearningCard
                key={post.id}
                title={post.title}
                excerpt={post.excerpt || ''}
                featuredImageUrl={post.featured_image_url || undefined}
                authorName={post.author_name}
                publishedAt={post.published_at}
                category={post.category as 'learning' | 'news'}
                onClick={() => navigate(`/learning-center/${post.slug}`)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('content:learningCenter.emptyState')}</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
