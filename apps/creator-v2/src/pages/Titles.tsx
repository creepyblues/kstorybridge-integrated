import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { titlesService, type Title } from '@/services/titlesService'
import { draftService, type TitleDraft } from '@/services/draftService'
import { Eye, BookOpen, Clock, FileEdit } from 'lucide-react'

export default function Titles() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [titles, setTitles] = useState<Title[]>([])
  const [draft, setDraft] = useState<TitleDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTitles()
  }, [user])

  const loadTitles = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Load both titles and draft in parallel
      const [titlesData, draftData] = await Promise.all([
        titlesService.getTitlesByCreator(user.id),
        draftService.loadDraft(user.id)
      ])

      setTitles(titlesData)
      setDraft(draftData)
    } catch (err) {
      console.error('Error loading titles:', err)
      setError('Failed to load titles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatViews = (views: number | null | undefined) => {
    if (!views) return '0'
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toLocaleString()
  }

  const formatLastSaved = (timestamp: string) => {
    const now = new Date()
    const saved = new Date(timestamp)
    const diffMs = now.getTime() - saved.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return saved.toLocaleDateString()
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-6xl">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl">
          <Card className="bg-transparent border-red-300 shadow-none rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <Button
                onClick={loadTitles}
                variant="outline"
                className="mt-4 border-gray-300 hover:bg-gray-100"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">My Titles</h1>
            <p className="text-gray-600 mt-1">Manage your content submissions</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/titles/add')}
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
            >
              Add New Title
            </Button>
            <Button
              onClick={() => navigate('/titles/add-survey')}
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
            >
              Add New Title (Survey)
            </Button>
          </div>
        </div>

        {titles.length === 0 && !draft ? (
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <CardTitle>Title List</CardTitle>
              <CardDescription>
                Your submitted titles will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center py-8">
                No titles yet. Click "Add New Title" or "Add New Title (Survey)" to submit your first title!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Draft Card (if exists) */}
            {draft && (
              <Card
                key="draft"
                className="bg-transparent border-amber-400 border-2 shadow-none rounded-2xl cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate('/titles/add-survey')}
              >
                <CardContent className="p-0">
                  {/* Draft Image Placeholder */}
                  <div className="w-full h-48 bg-gradient-to-br from-amber-50 to-amber-100 rounded-t-2xl overflow-hidden flex items-center justify-center">
                    <FileEdit className="w-12 h-12 text-amber-500" />
                  </div>

                  {/* Draft Info */}
                  <div className="p-4">
                    {/* Draft Badge */}
                    <div className="mb-2">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500 text-white">
                        DRAFT
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-black mb-1 line-clamp-1">
                      {draft.draft_data?.title_name_en || draft.draft_data?.title_name_kr || 'Untitled Draft'}
                    </h3>
                    {draft.draft_data?.title_name_kr && draft.draft_data?.title_name_en && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {draft.draft_data.title_name_kr}
                      </p>
                    )}

                    {/* Progress Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Step {draft.current_step} of 5</span>
                      </div>
                    </div>

                    {/* Last Saved */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Last saved: {formatLastSaved(draft.last_saved_at)}</span>
                    </div>

                    {/* Continue Button */}
                    <div className="mt-3">
                      <p className="text-xs text-amber-600 font-medium">Click to continue editing →</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Title Cards */}
            {titles.map((title) => (
              <Card
                key={title.title_id}
                className="bg-transparent border-gray-300 shadow-none rounded-2xl cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/titles/${title.title_id}`)}
              >
                <CardContent className="p-0">
                  {/* Cover Image */}
                  <div className="w-full h-48 bg-gray-100 rounded-t-2xl overflow-hidden">
                    {title.title_image ? (
                      <img
                        src={title.title_image}
                        alt={title.title_name_en || title.title_name_kr}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Title Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-black mb-1 line-clamp-1">
                      {title.title_name_en || title.title_name_kr}
                    </h3>
                    {title.title_name_kr && title.title_name_en && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {title.title_name_kr}
                      </p>
                    )}
                    {title.story_author && (
                      <p className="text-sm text-gray-600 mb-3">
                        by {title.story_author}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{formatViews(title.views)} views</span>
                      </div>
                      {title.chapters && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{title.chapters} chapters</span>
                        </div>
                      )}
                    </div>

                    {/* Genre Badge */}
                    {title.genre && (
                      <div className="mt-3">
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                          {Array.isArray(title.genre) ? title.genre[0] : title.genre}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {(titles.length > 0 || draft) && (
          <p className="text-sm text-gray-500 text-center mt-8">
            {titles.length} {titles.length === 1 ? 'title' : 'titles'}
            {draft && ` + 1 draft`} total
          </p>
        )}
      </div>
    </MainLayout>
  )
}
