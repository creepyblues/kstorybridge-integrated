import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { titlesService, type Title } from '@/services/titlesService'
import { draftService, type TitleDraft } from '@/services/draftService'
import { TitleCard } from '@/components/TitleCard'

export default function Titles() {
  const { t } = useTranslation(['titles', 'common'])
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(t('titles:list.loadingError'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click navigation

    if (!window.confirm(t('titles:list.deleteConfirmation'))) {
      return
    }

    try {
      await draftService.deleteDraftById(draftId)
      await loadTitles() // Refresh list
    } catch (error) {
      console.error('Error deleting draft:', error)
      alert(t('titles:list.deleteFailed'))
    }
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">{t('titles:list.title')}</h1>
          <Button
            onClick={() => navigate('/titles/add-title')}
            className="bg-sunrise-coral-500 text-white hover:bg-sunrise-coral-600"
          >
            {t('titles:list.addNewButton')}
          </Button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('titles:list.loadingMessage', 'Loading titles...')}</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <Button
              onClick={loadTitles}
              variant="outline"
              className="mt-4 border-gray-300 hover:bg-gray-100"
            >
              {t('titles:list.retryButton')}
            </Button>
          </div>
        )}

        {!loading && !error && titles.length === 0 && drafts.length === 0 && pendingDrafts.length === 0 && rejectedDrafts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('titles:list.emptyStateDescription')}</p>
          </div>
        )}

        {!loading && !error && (titles.length > 0 || drafts.length > 0 || pendingDrafts.length > 0 || rejectedDrafts.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* In-Progress Drafts */}
            {drafts.map((draft) => (
              <TitleCard
                key={draft.id}
                draft={draft}
                status="draft"
                currentStep={draft.current_step}
                lastSaved={draft.last_saved_at}
                onClick={() => navigate(`/titles/add-title?draftId=${draft.id}`)}
                onDelete={(e) => handleDeleteDraft(draft.id, e)}
              />
            ))}

            {/* Pending Submissions (awaiting approval) */}
            {pendingDrafts.map((pending) => (
              <TitleCard
                key={pending.id}
                draft={pending}
                status="pending"
                submittedAt={pending.submitted_at}
                onClick={() => {
                  alert(t('titles:list.pendingReviewMessage'))
                }}
              />
            ))}

            {/* Rejected Submissions (can be edited and resubmitted) */}
            {rejectedDrafts.map((rejected) => (
              <TitleCard
                key={rejected.id}
                draft={rejected}
                status="rejected"
                rejectionReason={rejected.rejection_reason}
                rejectedAt={rejected.rejected_at}
                onClick={() => {
                  alert(t('titles:list.rejectionMessage', { reason: rejected.rejection_reason || 'No reason provided' }))
                }}
              />
            ))}

            {/* Approved Title Cards */}
            {titles.map((title) => (
              <TitleCard
                key={title.title_id}
                title={title}
                status="approved"
                onClick={() => navigate(`/titles/${title.title_id}`)}
              />
            ))}
          </div>
        )}

        {!loading && !error && (titles.length > 0 || drafts.length > 0 || pendingDrafts.length > 0 || rejectedDrafts.length > 0) && (
          <p className="text-sm text-gray-500 text-center mt-8">
            {t('titles:list.statsApproved', { count: titles.length })}
            {pendingDrafts.length > 0 && ` + ${t('titles:list.statsPending', { count: pendingDrafts.length })}`}
            {rejectedDrafts.length > 0 && ` + ${t('titles:list.statsRejected', { count: rejectedDrafts.length })}`}
            {drafts.length > 0 && ` + ${t('titles:list.statsDrafts', { count: drafts.length })}`}
          </p>
        )}
      </div>
    </MainLayout>
  )
}
