/**
 * Post Detail Page
 * Displays full content for Learning Center or News posts
 * Redesigned with magazine-style layout and sunrise-coral accents
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface ContentPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  category: 'learning' | 'news'
  featured_image_url: string | null
  tags: string[] | null
  author_name: string
  published_at: string | null
  created_at: string
}

interface RelatedPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image_url: string | null
  tags: string[] | null
}

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['content', 'common'])
  const { toast } = useToast()
  const [post, setPost] = useState<ContentPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [readingProgress, setReadingProgress] = useState(0)
  const articleRef = useRef<HTMLElement>(null)

  // Reading progress tracker
  const handleScroll = useCallback(() => {
    if (!articleRef.current) return

    const element = articleRef.current
    const totalHeight = element.scrollHeight - element.clientHeight
    const windowScrollTop = window.scrollY - element.offsetTop + 200

    if (windowScrollTop <= 0) {
      setReadingProgress(0)
      return
    }

    if (windowScrollTop >= totalHeight) {
      setReadingProgress(100)
      return
    }

    setReadingProgress((windowScrollTop / totalHeight) * 100)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        navigate('/')
        return
      }

      try {
        const { data, error } = await supabase
          .from('content_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            toast({
              title: t('content:postDetail.error.notFoundTitle'),
              description: t('content:postDetail.error.notFoundMessage'),
              variant: 'destructive',
            })
            navigate('/')
            return
          }
          throw error
        }

        setPost(data)

        // Fetch related posts from same category
        const { data: related } = await supabase
          .from('content_posts')
          .select('id, title, slug, excerpt, featured_image_url, tags')
          .eq('category', data.category)
          .eq('status', 'published')
          .neq('id', data.id)
          .limit(3)

        if (related) {
          setRelatedPosts(related)
        }
      } catch (err) {
        console.error('Error fetching post:', err)
        toast({
          title: t('content:postDetail.error.loadErrorTitle'),
          description: t('content:postDetail.error.loadErrorMessage'),
          variant: 'destructive',
        })
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug, navigate, toast, t])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const estimateReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const textContent = content.replace(/<[^>]*>/g, '')
    const wordCount = textContent.split(/\s+/).length
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  }

  const handleBack = () => {
    navigate(post?.category === 'learning' ? '/learning-center' : '/news')
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-24">
            <Icon
              icon="solar:spinner-bold"
              className="h-8 w-8 animate-spin text-sunrise-coral mb-3"
            />
            <p className="text-gray-500">{t('content:postDetail.loading')}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-24">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Icon
                icon="solar:document-text-bold-duotone"
                className="h-8 w-8 text-gray-400"
              />
            </div>
            <p className="text-gray-500">{t('content:postDetail.notFound')}</p>
            <Button
              variant="outline"
              className="mt-4 border-gray-300 hover:bg-gray-100"
              onClick={() => navigate('/learning-center')}
            >
              Back to Learning Center
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const readingTime = estimateReadingTime(post.content)

  return (
    <MainLayout>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-sunrise-coral to-orange-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <button
            onClick={handleBack}
            className="group inline-flex items-center gap-2 text-sm text-gray-500 hover:text-sunrise-coral transition-colors"
          >
            <Icon
              icon="solar:arrow-left-linear"
              className="h-4 w-4 group-hover:-translate-x-1 transition-transform"
            />
            <span>
              {post.category === 'learning' ? 'Learning Center' : 'News'}
            </span>
          </button>
        </nav>

        <article ref={articleRef}>
          {/* Hero Section */}
          <header className="mb-12">
            {/* Category & Reading Time */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-sunrise-coral/10 text-sunrise-coral">
                <Icon
                  icon={
                    post.category === 'learning'
                      ? 'solar:graduation-cap-bold'
                      : 'solar:newspaper-bold'
                  }
                  className="h-3.5 w-3.5"
                />
                {post.category === 'learning' ? 'Learning' : 'News'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <Icon icon="solar:clock-circle-linear" className="h-3.5 w-3.5" />
                {readingTime} min read
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-sunrise-coral/10 hover:text-sunrise-coral transition-colors cursor-default"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author & Date */}
            <div className="flex items-center gap-4 pb-8 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sunrise-coral to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                  {post.author_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{post.author_name}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(post.published_at || post.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="mb-12 -mx-4 sm:mx-0">
              <div className="relative overflow-hidden rounded-none sm:rounded-2xl bg-gray-100">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <div className="mb-10 pl-6 border-l-4 border-sunrise-coral">
              <p className="text-xl text-gray-600 leading-relaxed italic">
                {post.excerpt}
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className="mb-16">
            <div
              className="prose prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-black prose-headings:tracking-tight
                prose-h1:text-4xl prose-h1:leading-tight prose-h1:mt-12 prose-h1:mb-6
                prose-h2:text-2xl prose-h2:leading-snug prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:leading-snug prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-gray-700 prose-p:leading-[1.8] prose-p:text-[17px] [&>p]:mb-6
                prose-a:text-sunrise-coral prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                prose-strong:text-black prose-strong:font-semibold
                prose-em:text-gray-600
                prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 [&_ul]:list-outside
                prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 [&_ol]:list-outside
                prose-li:text-gray-700 prose-li:leading-[1.8] prose-li:mb-2 prose-li:text-[17px] prose-li:ml-2
                prose-img:rounded-xl prose-img:my-8 prose-img:shadow-sm
                prose-blockquote:border-l-4 prose-blockquote:border-sunrise-coral prose-blockquote:pl-6 prose-blockquote:my-8 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:not-italic prose-blockquote:font-normal [&_blockquote_p]:italic
                prose-code:bg-sunrise-coral/10 prose-code:text-sunrise-coral prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-5 prose-pre:rounded-xl prose-pre:my-8
                prose-hr:border-gray-200 prose-hr:my-12
                [&_ul]:my-4 [&_ol]:my-4 [&_li]:my-1 [&_li_p]:my-0"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Article Footer */}
          <footer className="pt-8 border-t border-gray-200">
            {/* Share & Actions */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 mr-2">Share:</span>
                <button className="p-2 rounded-full bg-gray-100 hover:bg-sunrise-coral/10 text-gray-600 hover:text-sunrise-coral transition-colors">
                  <Icon icon="mdi:twitter" className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-full bg-gray-100 hover:bg-sunrise-coral/10 text-gray-600 hover:text-sunrise-coral transition-colors">
                  <Icon icon="mdi:linkedin" className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-full bg-gray-100 hover:bg-sunrise-coral/10 text-gray-600 hover:text-sunrise-coral transition-colors">
                  <Icon icon="solar:link-bold" className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
                onClick={handleBack}
              >
                <Icon icon="solar:arrow-left-linear" className="h-4 w-4 mr-2" />
                Back to {post.category === 'learning' ? 'Learning Center' : 'News'}
              </Button>
            </div>

            {/* Related Articles */}
            {relatedPosts.length > 0 && (
              <div className="pt-8 border-t border-gray-200">
                <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                  <Icon
                    icon="solar:widget-4-bold-duotone"
                    className="h-5 w-5 text-sunrise-coral"
                  />
                  Continue Reading
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((related) => (
                    <button
                      key={related.id}
                      onClick={() =>
                        navigate(
                          `/${post.category === 'learning' ? 'learning-center' : 'news'}/${related.slug}`
                        )
                      }
                      className="group text-left p-4 rounded-xl border border-gray-200 hover:border-sunrise-coral/30 hover:bg-sunrise-coral/5 transition-all"
                    >
                      {related.featured_image_url ? (
                        <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-gray-100">
                          <img
                            src={related.featured_image_url}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video rounded-lg mb-3 bg-gradient-to-br from-sunrise-coral/5 to-orange-50 flex items-center justify-center">
                          <Icon
                            icon="solar:document-text-bold-duotone"
                            className="h-8 w-8 text-sunrise-coral/50"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-sunrise-coral transition-colors">
                        {related.title}
                      </h3>
                      {related.excerpt && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-2">
                          {related.excerpt}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </footer>
        </article>
      </div>
    </MainLayout>
  )
}
