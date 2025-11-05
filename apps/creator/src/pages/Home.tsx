import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/MainLayout'
import { titlesService, Title } from '@/services/titlesService'
import { draftService, TitleDraft, getDraftDisplayName } from '@/services/draftService'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [titles, setTitles] = useState<Title[]>([])
  const [drafts, setDrafts] = useState<TitleDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Fetch titles and drafts in parallel
      const [titlesData, draftsData] = await Promise.all([
        titlesService.getTitlesByCreator(user.id),
        draftService.getAllDrafts(user.id, 'draft'),
      ])

      setTitles(titlesData)
      setDrafts(draftsData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
        </div>

        {/* Two-column grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Titles Section */}
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Titles</CardTitle>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-black">
                  {titles.length + drafts.length}
                </span>
              </div>
              <CardDescription>Your published titles and drafts</CardDescription>
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
                  <p className="text-gray-600 text-sm mb-3">No titles yet</p>
                  <button
                    onClick={() => navigate('/titles/add-title')}
                    className="text-black hover:text-gray-700 underline text-sm"
                  >
                    Create your first title
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Published Titles */}
                  {titles.map((title) => (
                    <div
                      key={title.title_id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                    >
                      <button
                        onClick={() => navigate(`/titles/${title.title_id}`)}
                        className="text-black hover:text-gray-700 font-medium text-sm text-left w-full"
                      >
                        {title.title_name_en || title.title_name_kr || 'Untitled'}
                      </button>
                      <p className="text-gray-500 text-xs mt-1">Published</p>
                    </div>
                  ))}

                  {/* Drafts */}
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors bg-gray-50"
                    >
                      <button
                        onClick={() => navigate(`/titles/add-title?draftId=${draft.id}`)}
                        className="text-black hover:text-gray-700 font-medium text-sm text-left w-full"
                      >
                        {getDraftDisplayName(draft)}
                      </button>
                      <p className="text-gray-500 text-xs mt-1">Draft • Step {draft.current_step} of 5</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Buyer Inquiries Section */}
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Buyer Inquiries</CardTitle>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-black">
                  0
                </span>
              </div>
              <CardDescription>Inquiries from interested buyers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm mb-4">Coming soon</p>
                <p className="text-gray-500 text-xs">You'll see buyer inquiries here when they contact you</p>
              </div>

              {/* Placeholder items */}
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3 border border-gray-200 rounded-lg bg-gray-50 opacity-40"
                  >
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
