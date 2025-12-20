import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { TitleDraft } from '@/services/draftService'

interface TitlesDraftCardProps {
  draft: TitleDraft
  onClick?: () => void
  onDelete?: (e: React.MouseEvent) => void
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function TitlesDraftCard({ draft, onClick, onDelete }: TitlesDraftCardProps) {
  const { t } = useTranslation(['titles'])
  const displayTitle = draft.draft_data?.title_name_kr || draft.draft_data?.title_name_en || t('titles:draft.untitled', 'Untitled Draft')
  const displayImage = draft.draft_data?.title_image

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-36 cursor-pointer group relative"
    >
      {/* Delete button - top right */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(e)
          }}
          className="absolute -top-2 -right-2 z-10 p-1.5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
        >
          <Icon icon="solar:close-circle-bold" className="h-4 w-4" />
        </button>
      )}

      {/* Cover Image - Portrait 3:4 */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 mb-2 border border-gray-200 group-hover:border-sunrise-coral/30 transition-colors">
        {displayImage ? (
          <img
            src={displayImage}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon icon="solar:document-bold-duotone" className="h-10 w-10 text-gray-300" />
          </div>
        )}

        {/* Status Badge - Top Left */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500 text-white shadow-sm">
            <Icon icon="solar:pen-bold" className="h-3 w-3" />
            {t('titles:draft.step', 'Step')} {draft.current_step}/5
          </span>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-sunrise-coral transition-colors">
        {displayTitle}
      </p>

      {/* Last saved */}
      <p className="text-xs text-gray-400 mt-0.5">
        {formatTimeAgo(draft.last_saved_at)}
      </p>
    </div>
  )
}
