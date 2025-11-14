/**
 * Post Detail Page
 * Displays full content for Learning Center or News posts
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
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
      {/* Page container - matches other pages */}
      <div className="max-w-7xl mx-auto">
        {/* Article Container - No card wrapper for clean Substack look */}
        <article>
          {/* Header section */}
          <div>
            {/* Tags - Subtle, above title */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title - Large, bold, Substack-style */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta Info - Simplified, subtle */}
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-12">
              <span className="font-medium">By {post.author_name}</span>
              <span>•</span>
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </div>
          </div>

          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="mb-12 -mx-4 sm:mx-0">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-auto rounded-none sm:rounded-lg"
              />
            </div>
          )}

          {/* Excerpt - If present */}
          {post.excerpt && (
            <div className="mb-12">
              <p className="text-xl text-gray-600 leading-relaxed italic">
                {post.excerpt}
              </p>
            </div>
          )}

          {/* Main Content - Substack typography */}
          <div>
            <div
              className="prose prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-black prose-headings:mb-4 prose-headings:mt-8
                prose-h1:text-4xl prose-h1:leading-tight
                prose-h2:text-3xl prose-h2:leading-snug
                prose-h3:text-2xl prose-h3:leading-snug
                prose-p:text-gray-700 prose-p:leading-[1.8] prose-p:text-lg [&>p]:mb-[0.5em]
                prose-a:text-black prose-a:underline prose-a:decoration-2 hover:prose-a:text-gray-600
                prose-strong:text-black prose-strong:font-semibold
                prose-em:text-gray-700 prose-em:italic
                prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 [&_ul]:list-outside
                prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 [&_ol]:list-outside
                prose-li:text-gray-700 prose-li:leading-[1.8] prose-li:mb-2 prose-li:text-lg prose-li:ml-4
                prose-img:rounded-lg prose-img:my-8
                prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-6 prose-blockquote:my-8 prose-blockquote:italic prose-blockquote:text-gray-600
                prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-base prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-6
                prose-hr:border-gray-200 prose-hr:my-12"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>
      </div>
    </MainLayout>
  );
}
