/**
 * Post Detail Page
 * Displays full content for Learning Center or News posts
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ContentPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: 'learning' | 'news';
  featured_image_url: string | null;
  tags: string[] | null;
  author_name: string;
  published_at: string | null;
  created_at: string;
}

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<ContentPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('content_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Not found
            toast({
              title: 'Post not found',
              description: 'The requested post could not be found.',
              variant: 'destructive',
            });
            navigate('/');
            return;
          }
          throw error;
        }

        setPost(data);
      } catch (err) {
        console.error('Error fetching post:', err);
        toast({
          title: 'Error loading post',
          description: 'Failed to load the post. Please try again.',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, navigate, toast]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleBack = () => {
    navigate(post?.category === 'learning' ? '/learning-center' : '/news');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading post...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Post not found</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {post.category === 'learning' ? 'Learning Center' : 'News'}
        </Button>

        {/* Post Content */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-300">
              <span>By {post.author_name}</span>
              <span>•</span>
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </div>

            {/* Featured Image */}
            {post.featured_image_url && (
              <div className="mb-8">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}

            {/* Excerpt */}
            {post.excerpt && (
              <div className="mb-6 p-4 bg-gray-50 border-l-4 border-gray-300 rounded-r-lg">
                <p className="text-lg text-gray-700 italic">{post.excerpt}</p>
              </div>
            )}

            {/* Main Content */}
            <div
              className="prose prose-sm sm:prose lg:prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-black
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-a:text-black prose-a:underline hover:prose-a:text-gray-700
                prose-strong:text-black prose-strong:font-semibold
                prose-ul:list-disc prose-ol:list-decimal
                prose-li:text-gray-700
                prose-img:rounded-lg prose-img:shadow-sm
                prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
                prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </CardContent>
        </Card>

        {/* Back to List Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleBack}
            variant="outline"
            className="border-gray-300 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {post.category === 'learning' ? 'Learning Center' : 'News'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
