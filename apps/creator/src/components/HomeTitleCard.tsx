import { useTranslation } from 'react-i18next'
import { BookOpen, FileEdit } from 'lucide-react'
import type { Title } from '@/services/titlesService'
import type { TitleDraft } from '@/services/draftService'

type TitleStatus = 'published' | 'draft'

interface HomeTitleCardProps {
  // For published titles
  title?: Title
  // For drafts
  draft?: TitleDraft
  status: TitleStatus
  // Additional draft metadata
  currentStep?: number
  // Actions
  onClick?: () => void
}

export function HomeTitleCard({
  title,
  draft,
  status,
  currentStep,
  onClick,
}: HomeTitleCardProps) {
  const { t } = useTranslation(['titles'])

  // Determine data source
  const displayData = title || draft?.draft_data
  const displayTitle =
    displayData?.title_name_en || displayData?.title_name_kr || t('titles:card.untitled')
  const displayImage = displayData?.title_image

  // Status badge configuration
  const getStatusConfig = () => {
    if (status === 'draft') {
      return {
        badgeColor: 'bg-amber-500 text-white',
        badgeText: currentStep
          ? `Draft • Step ${currentStep} of 5`
          : t('titles:card.statusDraft'),
        icon: FileEdit,
      }
    }
    return {
      badgeColor: 'bg-green-500 text-white',
      badgeText: 'Published',
      icon: BookOpen,
    }
  }

  const config = getStatusConfig()
  const FallbackIcon = config.icon

  return (
    <div
      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-sunrise-coral/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Square Cover Image */}
      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {displayImage ? (
          <img
            src={displayImage}
            alt={displayTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FallbackIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-black truncate hover:text-gray-700">
          {displayTitle}
        </h3>
        <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${config.badgeColor}`}>
          {config.badgeText}
        </span>
      </div>
    </div>
  )
}
