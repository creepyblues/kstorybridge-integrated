import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
}

export default function LearningCenter() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('content_posts')
          .select('id, title, slug, excerpt, featured_image_url, tags')
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
          <h1 className="text-2xl sm:text-3xl font-bold text-black">Learning Center</h1>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading learning materials...</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <LearningCard
                key={post.id}
                title={post.title}
                description={post.excerpt || ''}
                imageUrl={post.featured_image_url || undefined}
                tags={post.tags || []}
                onClick={() => navigate(`/learning-center/${post.slug}`)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No learning materials available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
