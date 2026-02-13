import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Title } from '@/services/titlesService'
import { TitleDraft } from '@/services/draftService'

interface TitleShelfProps {
  titles: Title[]
  drafts: TitleDraft[]
  loading: boolean
}

export function TitleShelf({ titles, drafts, loading }: TitleShelfProps) {
  const { t } = useTranslation(['titles', 'common'])
  const navigate = useNavigate()

  const hasContent = titles.length > 0 || drafts.length > 0

  return (
    <div className="bg-orange-50/30 border border-gray-200 rounded-2xl p-5 sm:p-6">
      {/* Section Header - Option C style */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="border-l-4 border-sunrise-coral pl-3 text-xl font-semibold text-black">
          {t('titles:list.title')}
        </h2>
        {hasContent && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/titles')}
            className="text-sunrise-coral hover:text-sunrise-coral hover:bg-sunrise-coral/5"
          >
            {t('common:viewAll')}
            <Icon icon="solar:arrow-right-linear" className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Icon icon="solar:spinner-bold" className="h-6 w-6 animate-spin text-sunrise-coral" />
        </div>
      ) : !hasContent ? (
        <div className="text-center py-12 px-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center mb-4">
            <Icon icon="solar:document-add-bold-duotone" className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">{t('titles:list.emptyState')}</h3>
          <p className="text-sm text-gray-500 mb-4">{t('titles:list.emptyStateDescription')}</p>
          <Button
            onClick={() => navigate('/titles/add-title')}
            className="bg-sunrise-coral text-white hover:bg-sunrise-coral/90"
          >
            <Icon icon="solar:add-circle-bold" className="h-4 w-4 mr-2" />
            {t('common:home.quickActions.addTitle')}
          </Button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {/* Drafts first */}
          {drafts.map((draft) => (
            <TitleShelfCard
              key={draft.id}
              title={draft.draft_data?.title_name_kr || t('titles:untitledDraft')}
              status="draft"
              step={draft.current_step}
              onClick={() => navigate(`/titles/add-title?draftId=${draft.id}`)}
            />
          ))}
          {/* Published titles */}
          {titles.map((title) => (
            <TitleShelfCard
              key={title.title_id}
              title={title.title_name_kr || title.title_name_en || t('titles:untitled')}
              imageUrl={title.title_image}
              status="published"
              onClick={() => navigate(`/titles/${title.title_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface TitleShelfCardProps {
  title: string
  imageUrl?: string | null
  status: 'draft' | 'published'
  step?: number
  onClick: () => void
}

function TitleShelfCard({ title, imageUrl, status, step, onClick }: TitleShelfCardProps) {
  const { t } = useTranslation(['titles'])

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-36 cursor-pointer group"
    >
      {/* Cover Image */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white/60 mb-2 border border-gray-200 group-hover:border-sunrise-coral/30 transition-colors">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon icon="solar:book-bold-duotone" className="h-10 w-10 text-gray-300" />
          </div>
        )}
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          {status === 'draft' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500 text-white">
              <Icon icon="solar:pen-bold" className="h-3 w-3" />
              {step ? `${step}/5` : t('titles:status.draft')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-500 text-white">
              <Icon icon="solar:check-circle-bold" className="h-3 w-3" />
              {t('titles:status.published')}
            </span>
          )}
        </div>
      </div>
      {/* Title */}
      <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-sunrise-coral transition-colors">
        {title}
      </p>
    </div>
  )
}
