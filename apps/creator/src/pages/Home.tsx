import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { MainLayout } from '@/components/layout/MainLayout'
import { titlesService, Title } from '@/services/titlesService'
import { draftService, TitleDraft } from '@/services/draftService'
import { listPosts, type ContentPost } from '@/services/contentService'
import {
  QuickActionsRow,
  TitleShelf,
  CreatorProgressCard,
  LearningSpotlight,
  UpdatesFeed,
} from '@/components/home'

export default function Home() {
  const { t } = useTranslation(['common'])
  const { user } = useAuth()
  const [titles, setTitles] = useState<Title[]>([])
  const [drafts, setDrafts] = useState<TitleDraft[]>([])
  const [newsPosts, setNewsPosts] = useState<ContentPost[]>([])
  const [learningPosts, setLearningPosts] = useState<ContentPost[]>([])
  const [loading, setLoading] = useState(true)

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

      // Fetch titles, drafts, news posts, and learning posts in parallel
      const [titlesData, draftsData, newsData, learningData] = await Promise.all([
        titlesService.getTitlesByCreator(user.id),
        draftService.getAllDrafts(user.id, 'draft'),
        listPosts({ category: 'news', status: 'published', limit: 5 }),
        listPosts({ category: 'learning', status: 'published', limit: 3 }),
      ])

      setTitles(titlesData)
      setDrafts(draftsData)
      setNewsPosts(newsData.posts)
      setLearningPosts(learningData.posts)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Get user's display name
  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.pen_name
    || 'Creator'

  // Quick stats for welcome card
  const titleCount = titles.length
  const draftCount = drafts.length

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-sunrise-coral/5 via-orange-50/50 to-amber-50/40 rounded-2xl p-6 sm:p-8 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">
                {t('common:home.welcome')}, {displayName}
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                {titleCount > 0 || draftCount > 0 ? (
                  <span>
                    {titleCount} {titleCount === 1 ? 'title' : 'titles'}{draftCount > 0 && `, ${draftCount} ${draftCount === 1 ? 'draft' : 'drafts'}`}
                  </span>
                ) : (
                  t('common:home.welcomeSubtitle')
                )}
              </p>
            </div>
            <QuickActionsRow />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column - 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            <TitleShelf titles={titles} drafts={drafts} loading={loading} />
            <LearningSpotlight posts={learningPosts} loading={loading} />
          </div>

          {/* Sidebar Column - 1 col */}
          <div className="space-y-8">
            <CreatorProgressCard titles={titles} drafts={drafts} />
            <UpdatesFeed posts={newsPosts} loading={loading} />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
