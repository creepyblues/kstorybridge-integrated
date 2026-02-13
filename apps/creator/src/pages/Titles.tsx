import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { titlesService, type Title } from '@/services/titlesService'
import { draftService, type TitleDraft } from '@/services/draftService'
import {
  TitlesSectionCard,
  TitlesStatsBar,
  TitlesDraftCard,
  TitlesAttentionItem,
  TitlesPublishedCard,
} from '@/components/titles'

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
    e.stopPropagation()

    if (!window.confirm(t('titles:list.deleteConfirmation'))) {
      return
    }

    try {
      await draftService.deleteDraftById(draftId)
      await loadTitles()
    } catch (error) {
      console.error('Error deleting draft:', error)
      alert(t('titles:list.deleteFailed'))
    }
  }

  const totalCount = titles.length + drafts.length + pendingDrafts.length + rejectedDrafts.length
  const hasNeedsAttention = pendingDrafts.length > 0 || rejectedDrafts.length > 0

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <Icon icon="solar:refresh-bold-duotone" className="h-12 w-12 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">{t('titles:list.loadingMessage', 'Loading titles...')}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <Icon icon="solar:danger-triangle-bold-duotone" className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
            <Button
              onClick={loadTitles}
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
            >
              {t('titles:list.retryButton')}
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Complete empty state
  if (totalCount === 0) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16 px-6">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
              <Icon icon="solar:document-add-bold-duotone" className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('titles:empty.title', 'Start Your Journey')}
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {t('titles:empty.description', 'Add your first title to begin showcasing your creative work to media buyers worldwide.')}
            </p>
            <Button
              className="bg-sunrise-coral text-white hover:bg-sunrise-coral/90"
              onClick={() => navigate('/titles/quick-add')}
            >
              <Icon icon="solar:add-circle-bold" className="h-4 w-4 mr-2" />
              {t('titles:empty.addButton', 'Add Your First Title')}
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">{t('titles:list.title')}</h1>
            <p className="text-gray-500 mt-1">{t('titles:list.subtitle', 'Manage and track your IP submissions')}</p>
          </div>
          <Button
            onClick={() => navigate('/titles/quick-add')}
            className="bg-sunrise-coral text-white hover:bg-sunrise-coral/90"
          >
            <Icon icon="solar:add-circle-bold" className="h-4 w-4 mr-2" />
            {t('titles:list.addNewButton')}
          </Button>
        </div>

        {/* Stats Bar */}
        <TitlesStatsBar
          draftsCount={drafts.length}
          pendingCount={pendingDrafts.length}
          rejectedCount={rejectedDrafts.length}
          publishedCount={titles.length}
        />

        {/* Section: In Progress (Drafts) */}
        <TitlesSectionCard
          borderColor="border-amber-500"
          bgTint="bg-amber-50/30"
          title={t('titles:sections.inProgress', 'In Progress')}
          count={drafts.length}
          className="mb-8"
        >
          {drafts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">{t('titles:sections.noDrafts', 'No drafts in progress')}</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
              {drafts.map((draft) => (
                <TitlesDraftCard
                  key={draft.id}
                  draft={draft}
                  onClick={() => navigate(`/titles/add-title?draftId=${draft.id}`)}
                  onDelete={(e) => handleDeleteDraft(draft.id, e)}
                />
              ))}
            </div>
          )}
        </TitlesSectionCard>

        {/* Section: Needs Attention (Pending + Rejected) */}
        {hasNeedsAttention && (
          <TitlesSectionCard
            borderColor="border-blue-500"
            bgTint="bg-blue-50/30"
            title={t('titles:sections.needsAttention', 'Needs Attention')}
            count={pendingDrafts.length + rejectedDrafts.length}
            className="mb-8"
          >
            <div className="space-y-3">
              {/* Pending items first */}
              {pendingDrafts.map((item) => (
                <TitlesAttentionItem
                  key={item.id}
                  item={item}
                  status="pending"
                  onClick={() => {
                    alert(t('titles:list.pendingReviewMessage'))
                  }}
                />
              ))}
              {/* Rejected items */}
              {rejectedDrafts.map((item) => (
                <TitlesAttentionItem
                  key={item.id}
                  item={item}
                  status="rejected"
                  onClick={() => {
                    alert(t('titles:list.rejectionMessage', { reason: item.rejection_reason || 'No reason provided' }))
                  }}
                />
              ))}
            </div>
          </TitlesSectionCard>
        )}

        {/* Section: Published Titles */}
        <TitlesSectionCard
          borderColor="border-emerald-500"
          bgTint="bg-emerald-50/30"
          title={t('titles:sections.published', 'Published Titles')}
          count={titles.length}
        >
          {titles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">{t('titles:sections.noPublished', 'No published titles yet')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('titles:sections.completeSubmission', 'Complete a title submission to see it here')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {titles.map((title) => (
                <TitlesPublishedCard
                  key={title.title_id}
                  title={title}
                  onClick={() => navigate(`/titles/${title.title_id}`)}
                />
              ))}
            </div>
          )}
        </TitlesSectionCard>
      </div>
    </MainLayout>
  )
}
