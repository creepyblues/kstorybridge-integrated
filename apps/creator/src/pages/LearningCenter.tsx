import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { MainLayout } from '@/components/layout/MainLayout'
import { supabase } from '@/lib/supabase'
import {
  LearningCardEnhanced,
  LearningFilters,
  LearningProgress,
} from '@/components/learning'

interface ContentPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image_url: string | null
  tags: string[] | null
  author_name: string
  published_at: string | null
  category: string
}

export default function LearningCenter() {
  const navigate = useNavigate()
  const { t } = useTranslation(['content', 'common'])
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('content_posts')
          .select('id, title, slug, excerpt, featured_image_url, tags, author_name, published_at, category')
          .eq('category', 'learning')
          .eq('status', 'published')
          .order('published_at', { ascending: false })

        if (error) throw error

        setPosts(data || [])
      } catch (err) {
        console.error('Error fetching learning posts:', err)
        setError('Failed to load learning materials. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (post.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ) ?? false)

      // Category filter (for future use when tags are categorized)
      const matchesCategory =
        selectedCategory === 'all' ||
        (post.tags?.some((tag) =>
          tag.toLowerCase().includes(selectedCategory.toLowerCase())
        ) ?? false)

      return matchesSearch && matchesCategory
    })
  }, [posts, searchQuery, selectedCategory])

  // Mock completed count (in future, this would come from user's learning progress)
  const completedCount = 0
  const totalCount = posts.length

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-sunrise-coral/10">
                <Icon
                  icon="solar:square-academic-cap-bold-duotone"
                  className="h-6 w-6 text-sunrise-coral"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">
                {t('content:learningCenter.title')}
              </h1>
            </div>
            <p className="text-gray-500">
              {t('content:learningCenter.subtitle')}
            </p>
          </div>

          {/* Progress Card (Desktop) */}
          <div className="hidden sm:block w-72">
            <LearningProgress completed={completedCount} total={totalCount} />
          </div>
        </div>

        {/* Progress Card (Mobile) */}
        <div className="sm:hidden mb-6">
          <LearningProgress completed={completedCount} total={totalCount} />
        </div>

        {/* Filters */}
        <LearningFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Icon
              icon="solar:spinner-bold"
              className="h-8 w-8 animate-spin text-sunrise-coral mb-3"
            />
            <p className="text-gray-500">{t('content:learningCenter.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <Icon
                icon="solar:danger-triangle-bold-duotone"
                className="h-8 w-8 text-red-500"
              />
            </div>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Learning Materials Grid */}
        {!loading && !error && filteredPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <LearningCardEnhanced
                key={post.id}
                title={post.title}
                excerpt={post.excerpt || ''}
                featuredImageUrl={post.featured_image_url || undefined}
                authorName={post.author_name}
                publishedAt={post.published_at}
                tags={post.tags}
                isCompleted={false}
                onClick={() => navigate(`/learning-center/${post.slug}`)}
              />
            ))}
          </div>
        )}

        {/* No Results State (search/filter applied) */}
        {!loading && !error && posts.length > 0 && filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Icon
                icon="solar:magnifer-bold-duotone"
                className="h-8 w-8 text-gray-400"
              />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="text-sunrise-coral hover:text-sunrise-coral/80 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Empty State (no posts at all) */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-sunrise-coral/10 flex items-center justify-center mb-4">
              <Icon
                icon="solar:book-2-bold-duotone"
                className="h-8 w-8 text-sunrise-coral/70"
              />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No learning materials yet
            </h3>
            <p className="text-gray-500">{t('content:learningCenter.emptyState')}</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
