import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/MainLayout'
import { titlesService, Title } from '@/services/titlesService'
import { draftService, TitleDraft } from '@/services/draftService'
import { listPosts, type ContentPost } from '@/services/contentService'
import { LearningCard } from '@/components/LearningCard'
import { HomeTitleCard } from '@/components/HomeTitleCard'

export default function Home() {
  const { t } = useTranslation(['titles', 'navigation', 'common'])
  const navigate = useNavigate()
  const { user } = useAuth()
  const [titles, setTitles] = useState<Title[]>([])
  const [drafts, setDrafts] = useState<TitleDraft[]>([])
  const [newsPosts, setNewsPosts] = useState<ContentPost[]>([])
  const [learningPosts, setLearningPosts] = useState<ContentPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Fetch titles, drafts, news posts, and learning posts in parallel
      const [titlesData, draftsData, newsData, learningData] = await Promise.all([
        titlesService.getTitlesByCreator(user.id),
        draftService.getAllDrafts(user.id, 'draft'),
        listPosts({ category: 'news', status: 'published', limit: 3 }),
        listPosts({ category: 'learning', status: 'published', limit: 3 }),
      ])

      setTitles(titlesData)
      setDrafts(draftsData)
      setNewsPosts(newsData.posts)
      setLearningPosts(learningData.posts)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">{t('navigation:pageHeaders.dashboard')}</h1>
        </div>

        {/* Two-column grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8 lg:mb-12">
          {/* Updates Section - News Posts */}
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('navigation:sidebar.updates')}</CardTitle>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-sunrise-coral-100 text-sunrise-coral-700">
                  {newsPosts.length}
                </span>
              </div>
              <CardDescription>Latest news and announcements</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : newsPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm">No news updates at the moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {newsPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => navigate(`/news/${post.slug}`)}
                      className="p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer"
                    >
                      <h3 className="font-semibold text-black text-sm mb-1">{post.title}</h3>
                      {post.excerpt && (
                        <p className="text-gray-600 text-xs line-clamp-2">{post.excerpt}</p>
                      )}
                      {post.published_at && (
                        <p className="text-gray-500 text-xs mt-2">
                          {new Date(post.published_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {newsPosts.length > 0 && (
                <button
                  onClick={() => navigate('/news')}
                  className="text-sunrise-coral-600 hover:text-sunrise-coral-700 underline text-sm font-medium mt-4 block"
                >
                  View All News
                </button>
              )}
            </CardContent>
          </Card>

          {/* Titles Section */}
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('titles:list.title')}</CardTitle>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-sunrise-coral-100 text-sunrise-coral-700">
                  {titles.length + drafts.length}
                </span>
              </div>
              <CardDescription>{t('titles:list.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              ) : titles.length === 0 && drafts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm mb-3">{t('titles:list.emptyState')}</p>
                  <button
                    onClick={() => navigate('/titles/add-title')}
                    className="text-sunrise-coral-600 hover:text-sunrise-coral-700 underline text-sm font-medium"
                  >
                    {t('titles:list.emptyStateDescription')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Published Titles */}
                  {titles.map((title) => (
                    <HomeTitleCard
                      key={title.title_id}
                      title={title}
                      status="published"
                      onClick={() => navigate(`/titles/${title.title_id}`)}
                    />
                  ))}

                  {/* Drafts */}
                  {drafts.map((draft) => (
                    <HomeTitleCard
                      key={draft.id}
                      draft={draft}
                      status="draft"
                      currentStep={draft.current_step}
                      onClick={() => navigate(`/titles/add-title?draftId=${draft.id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Learning Center Section */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
          <CardHeader>
            <CardTitle>{t('navigation:pageHeaders.learningCenter')}</CardTitle>
            <CardDescription>Resources and guides to help you succeed</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : learningPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm">No learning resources available yet</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {learningPosts.map((post) => (
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
                {learningPosts.length > 0 && (
                  <button
                    onClick={() => navigate('/learning-center')}
                    className="text-sunrise-coral-600 hover:text-sunrise-coral-700 underline text-sm font-medium mt-6 block mx-auto"
                  >
                    View All Learning Resources
                  </button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
