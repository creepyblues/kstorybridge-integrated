import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { titlesService, type Title } from '@/services/titlesService'
import { draftService, type TitleDraft, getDraftDisplayName } from '@/services/draftService'
import { Eye, BookOpen, Clock, FileEdit, X } from 'lucide-react'

export default function Titles() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [titles, setTitles] = useState<Title[]>([])
  const [drafts, setDrafts] = useState<TitleDraft[]>([])
  const [pendingDrafts, setPendingDrafts] = useState<TitleDraft[]>([])
  const [rejectedDrafts, setRejectedDrafts] = useState<TitleDraft[]>([])
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

      // Load approved titles, in-progress drafts, pending submissions, and rejected submissions
      const [titlesData, draftsData, pendingData, rejectedData] = await Promise.all([
        titlesService.getTitlesByCreator(user.id),
        draftService.getAllDrafts(user.id, 'draft'),
        draftService.getAllDrafts(user.id, 'submitted'),
        draftService.getAllDrafts(user.id, 'rejected')
      ])

      setTitles(titlesData)
      setDrafts(draftsData)
      setPendingDrafts(pendingData)
      setRejectedDrafts(rejectedData)
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

  const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click navigation

    if (!window.confirm('Are you sure you want to delete this draft?')) {
      return
    }

    try {
      await draftService.deleteDraftById(draftId)
      await loadTitles() // Refresh list
    } catch (error) {
      console.error('Error deleting draft:', error)
      alert('Failed to delete draft. Please try again.')
    }
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
          <Button
            onClick={() => navigate('/titles/add-title')}
            variant="outline"
            className="border-gray-300 hover:bg-gray-100"
          >
            Add New Title
          </Button>
        </div>

        {titles.length === 0 && drafts.length === 0 && pendingDrafts.length === 0 && rejectedDrafts.length === 0 ? (
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <CardTitle>Title List</CardTitle>
              <CardDescription>
                Your submitted titles will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center py-8">
                No titles yet. Click "Add New Title" to submit your first title!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* In-Progress Drafts */}
            {drafts.map((draft) => (
              <Card
                key={draft.id}
                className="bg-transparent border-amber-400 border-2 shadow-none rounded-2xl cursor-pointer hover:border-amber-500 transition-colors"
                onClick={() => navigate(`/titles/add-title?draftId=${draft.id}`)}
              >
                <CardContent className="p-0">
                  {/* Draft Image */}
                  <div className="w-full h-48 bg-gradient-to-br from-amber-50 to-amber-100 rounded-t-2xl overflow-hidden flex items-center justify-center">
                    {draft.draft_data?.title_image ? (
                      <img
                        src={draft.draft_data.title_image}
                        alt={getDraftDisplayName(draft)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileEdit className="w-12 h-12 text-amber-500" />
                    )}
                  </div>

                  {/* Draft Info */}
                  <div className="p-4">
                    {/* Draft Badge & Delete Button */}
                    <div className="mb-2 flex justify-between items-center">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500 text-white">
                        DRAFT
                      </span>
                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-black mb-1 line-clamp-1">
                      {getDraftDisplayName(draft)}
                    </h3>

                    {/* Progress Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <BookOpen className="h-3 w-3" />
                      <span>Step {draft.current_step} of 5</span>
                    </div>

                    {/* Last Saved */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Last saved: {formatLastSaved(draft.last_saved_at)}</span>
                    </div>

                    {/* Continue Editing */}
                    <div className="mt-3">
                      <p className="text-xs text-amber-600 font-medium">Click to continue editing →</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pending Submissions (awaiting approval) */}
            {pendingDrafts.map((pending) => (
              <Card
                key={pending.id}
                className="bg-transparent border-blue-400 border-2 shadow-none rounded-2xl cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => {
                  alert('This submission is awaiting admin approval. You cannot edit it while under review.')
                }}
              >
                <CardContent className="p-0">
                  {/* Pending Image Placeholder */}
                  <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded-t-2xl overflow-hidden flex items-center justify-center">
                    {pending.draft_data?.title_image ? (
                      <img
                        src={pending.draft_data.title_image}
                        alt={pending.draft_data.title_name_en || pending.draft_data.title_name_kr}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Clock className="w-12 h-12 text-blue-500" />
                    )}
                  </div>

                  {/* Pending Info */}
                  <div className="p-4">
                    {/* Pending Badge */}
                    <div className="mb-2">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                        PENDING APPROVAL
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-black mb-1 line-clamp-1">
                      {pending.draft_data?.title_name_en || pending.draft_data?.title_name_kr || 'Untitled'}
                    </h3>
                    {pending.draft_data?.title_name_kr && pending.draft_data?.title_name_en && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {pending.draft_data.title_name_kr}
                      </p>
                    )}

                    {/* Submitted Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Clock className="h-3 w-3" />
                      <span>Submitted: {formatLastSaved(pending.submitted_at!)}</span>
                    </div>

                    {/* Status Message */}
                    <div className="mt-3">
                      <p className="text-xs text-blue-600 font-medium">Under admin review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Rejected Submissions (can be edited and resubmitted) */}
            {rejectedDrafts.map((rejected) => (
              <Card
                key={rejected.id}
                className="bg-transparent border-red-400 border-2 shadow-none rounded-2xl cursor-pointer hover:border-red-500 transition-colors"
                onClick={() => {
                  alert(`Rejection reason: ${rejected.rejection_reason || 'No reason provided'}\n\nYou can edit and resubmit this title from the Add Title page.`)
                }}
              >
                <CardContent className="p-0">
                  {/* Rejected Image Placeholder */}
                  <div className="w-full h-48 bg-gradient-to-br from-red-50 to-red-100 rounded-t-2xl overflow-hidden flex items-center justify-center">
                    {rejected.draft_data?.title_image ? (
                      <img
                        src={rejected.draft_data.title_image}
                        alt={rejected.draft_data.title_name_en || rejected.draft_data.title_name_kr}
                        className="w-full h-full object-cover opacity-70"
                      />
                    ) : (
                      <FileEdit className="w-12 h-12 text-red-500" />
                    )}
                  </div>

                  {/* Rejected Info */}
                  <div className="p-4">
                    {/* Rejected Badge */}
                    <div className="mb-2">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                        REJECTED
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-black mb-1 line-clamp-1">
                      {rejected.draft_data?.title_name_en || rejected.draft_data?.title_name_kr || 'Untitled'}
                    </h3>
                    {rejected.draft_data?.title_name_kr && rejected.draft_data?.title_name_en && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {rejected.draft_data.title_name_kr}
                      </p>
                    )}

                    {/* Rejection Reason */}
                    {rejected.rejection_reason && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-700 line-clamp-2">
                          <span className="font-semibold">Reason:</span> {rejected.rejection_reason}
                        </p>
                      </div>
                    )}

                    {/* Rejected Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Clock className="h-3 w-3" />
                      <span>Rejected: {formatLastSaved(rejected.rejected_at!)}</span>
                    </div>

                    {/* Action Message */}
                    <div className="mt-3">
                      <p className="text-xs text-red-600 font-medium">Click for details →</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Approved Title Cards */}
            {titles.map((title) => (
              <Card
                key={title.title_id}
                className="bg-transparent border-gray-300 shadow-none rounded-2xl cursor-pointer hover:border-gray-400 transition-colors"
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
                        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
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

        {(titles.length > 0 || drafts.length > 0 || pendingDrafts.length > 0 || rejectedDrafts.length > 0) && (
          <p className="text-sm text-gray-500 text-center mt-8">
            {titles.length} approved {titles.length === 1 ? 'title' : 'titles'}
            {pendingDrafts.length > 0 && ` + ${pendingDrafts.length} pending`}
            {rejectedDrafts.length > 0 && ` + ${rejectedDrafts.length} rejected`}
            {drafts.length > 0 && ` + ${drafts.length} ${drafts.length === 1 ? 'draft' : 'drafts'}`}
          </p>
        )}
      </div>
    </MainLayout>
  )
}
