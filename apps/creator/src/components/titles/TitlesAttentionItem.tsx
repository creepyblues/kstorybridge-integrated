import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { TitleDraft } from '@/services/draftService'

interface TitlesAttentionItemProps {
  item: TitleDraft
  status: 'pending' | 'rejected'
  onClick?: () => void
}

function formatTimeAgo(dateString: string | undefined): string {
  if (!dateString) return ''
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

export function TitlesAttentionItem({ item, status, onClick }: TitlesAttentionItemProps) {
  const { t } = useTranslation(['titles'])
  const displayTitle = item.draft_data?.title_name_kr || item.draft_data?.title_name_en || t('titles:draft.untitled', 'Untitled')
  const displayImage = item.draft_data?.title_image

  const statusConfig = {
    pending: {
      icon: 'solar:clock-circle-bold-duotone',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      label: t('titles:status.underReview', 'Under Review'),
      sublabel: t('titles:status.submittedAgo', 'Submitted {{time}}', { time: formatTimeAgo(item.submitted_at) }),
    },
    rejected: {
      icon: 'solar:danger-triangle-bold-duotone',
      bgColor: 'bg-red-500/10',
      iconColor: 'text-red-600',
      label: t('titles:status.needsRevision', 'Needs Revision'),
      sublabel: item.rejection_reason || t('titles:status.clickForDetails', 'Click to see details'),
    },
  }

  const config = statusConfig[status]

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
        {displayImage ? (
          <img src={displayImage} alt={displayTitle} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon icon="solar:book-bold-duotone" className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate group-hover:text-sunrise-coral transition-colors">
          {displayTitle}
        </p>
        <p className="text-sm text-gray-500 truncate">{config.sublabel}</p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
          <Icon icon={config.icon} className={`h-4 w-4 ${config.iconColor}`} />
        </div>
        <span className="text-xs font-medium text-gray-600 hidden sm:block">{config.label}</span>
        <Icon icon="solar:arrow-right-linear" className="h-4 w-4 text-gray-300 group-hover:text-sunrise-coral transition-colors" />
      </div>
    </div>
  )
}
