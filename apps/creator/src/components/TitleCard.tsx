import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Eye,
  BookOpen,
  Clock,
  FileEdit,
  X
} from 'lucide-react'
import type { Title } from '@/services/titlesService'
import type { TitleDraft } from '@/services/draftService'

type TitleStatus = 'draft' | 'pending' | 'rejected' | 'approved'

interface TitleCardProps {
  // For approved titles
  title?: Title
  // For draft/pending/rejected
  draft?: TitleDraft
  status: TitleStatus
  // Additional draft metadata
  currentStep?: number
  lastSaved?: string
  rejectionReason?: string
  submittedAt?: string
  rejectedAt?: string
  // Actions
  onClick?: () => void
  onDelete?: (e: React.MouseEvent) => void
}

export function TitleCard({
  title,
  draft,
  status,
  currentStep,
  lastSaved,
  rejectionReason,
  submittedAt,
  rejectedAt,
  onClick,
  onDelete
}: TitleCardProps) {
  const { t } = useTranslation(['titles'])
  const [isHovered, setIsHovered] = useState(false)

  // Determine data source
  const displayData = title || draft?.draft_data
  const displayTitle = displayData?.title_name_en || displayData?.title_name_kr || t('titles:card.untitled')
  const displayKoreanTitle = displayData?.title_name_kr
  const displayAuthor = title?.story_author
  const displayImage = displayData?.title_image
  const displayGenre = title?.genre
  const displayViews = title?.views
  const displayChapters = title?.chapters
  const displaySynopsis = title?.synopsis

  // Status-based styling
  const getStatusStyles = () => {
    switch (status) {
      case 'draft':
        return {
          border: 'border-amber-400 border-2 hover:border-amber-500',
          gradient: 'from-gray-100 to-gray-200',
          icon: FileEdit,
          iconColor: 'text-amber-500',
          badgeColor: 'bg-amber-500 text-white',
          badgeText: t('titles:card.statusDraft'),
          ctaColor: 'text-amber-600'
        }
      case 'pending':
        return {
          border: 'border-blue-400 border-2 hover:border-blue-500',
          gradient: 'from-gray-100 to-gray-200',
          icon: Clock,
          iconColor: 'text-blue-500',
          badgeColor: 'bg-blue-500 text-white',
          badgeText: t('titles:card.statusPending'),
          ctaColor: 'text-blue-600'
        }
      case 'rejected':
        return {
          border: 'border-red-400 border-2 hover:border-red-500',
          gradient: 'from-gray-100 to-gray-200',
          icon: FileEdit,
          iconColor: 'text-red-500',
          badgeColor: 'bg-red-500 text-white',
          badgeText: t('titles:card.statusRejected'),
          ctaColor: 'text-red-600'
        }
      case 'approved':
      default:
        return {
          border: 'border-gray-300 hover:border-gray-400',
          gradient: 'from-gray-100 to-gray-200',
          icon: BookOpen,
          iconColor: 'text-gray-400',
          badgeColor: 'bg-gray-100 text-gray-700',
          badgeText: '',
          ctaColor: ''
        }
    }
  }

  const styles = getStatusStyles()
  const FallbackIcon = styles.icon

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

    if (diffMins < 1) return t('titles:card.timeJustNow')
    if (diffMins < 60) return t('titles:card.timeMinutesAgo', { count: diffMins })
    if (diffHours < 24) return t('titles:card.timeHoursAgo', { count: diffHours })
    if (diffDays < 7) return t('titles:card.timeDaysAgo', { count: diffDays })
    return saved.toLocaleDateString()
  }

  return (
    <Card
      className={`group cursor-pointer transition-shadow duration-200 bg-white border-gray-200 overflow-hidden rounded-lg ${
        isHovered ? 'shadow-2xl' : 'shadow-md'
      } hover:shadow-xl`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Image Container - 4:3 aspect ratio */}
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${styles.gradient}`}>
        {displayImage ? (
          <img
            src={displayImage}
            alt={displayTitle}
            className={`w-full h-full object-cover ${status === 'rejected' ? 'opacity-70' : ''}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FallbackIcon className={`w-12 h-12 ${styles.iconColor}`} />
          </div>
        )}

        {/* Status Badge - Top Left */}
        {status !== 'approved' && (
          <div className="absolute top-3 left-3">
            <Badge className={`${styles.badgeColor} border-0 shadow-lg`}>
              {styles.badgeText}
            </Badge>
          </div>
        )}

        {/* Delete Button - Top Right (drafts only) */}
        {status === 'draft' && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 h-8 w-8 p-0 rounded-full bg-white/80 text-gray-500 hover:bg-white hover:text-red-600"
            onClick={onDelete}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-bold text-black line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors duration-200 will-change-auto">
            {displayTitle}
          </h3>
          {displayKoreanTitle && displayData?.title_name_en && (
            <p className="text-sm text-gray-600 line-clamp-1">
              {displayKoreanTitle}
            </p>
          )}
          {displayAuthor && (
            <p className="text-sm text-gray-600 font-medium">
              {t('titles:card.by', { author: displayAuthor })}
            </p>
          )}
        </div>

        {/* Synopsis (approved titles only) */}
        {status === 'approved' && displaySynopsis && (
          <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
            {displaySynopsis}
          </p>
        )}

        {/* Draft Progress */}
        {status === 'draft' && currentStep && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <BookOpen className="h-3 w-3" />
            <span>{t('titles:card.step', { current: currentStep })}</span>
          </div>
        )}

        {/* Last Saved (drafts) */}
        {status === 'draft' && lastSaved && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{t('titles:card.lastSaved', { time: formatLastSaved(lastSaved) })}</span>
          </div>
        )}

        {/* Submitted Timestamp (pending) */}
        {status === 'pending' && submittedAt && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{t('titles:card.submitted', { time: formatLastSaved(submittedAt) })}</span>
          </div>
        )}

        {/* Rejection Reason */}
        {status === 'rejected' && rejectionReason && (
          <div className="text-xs text-gray-700 line-clamp-2">
            {t('titles:card.rejectionReason', { reason: rejectionReason })}
          </div>
        )}

        {/* Rejected Timestamp */}
        {status === 'rejected' && rejectedAt && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{t('titles:card.rejected', { time: formatLastSaved(rejectedAt) })}</span>
          </div>
        )}

        {/* Stats (approved titles only) */}
        {status === 'approved' && (displayViews !== undefined || displayChapters !== undefined) && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {displayViews !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-blue-600" />
                <span>{t('titles:card.views', { count: formatViews(displayViews) })}</span>
              </div>
            )}
            {displayChapters && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span>{t('titles:card.chapters', { count: displayChapters })}</span>
              </div>
            )}
          </div>
        )}

        {/* Genre Badge (approved only) */}
        {status === 'approved' && displayGenre && (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(displayGenre) ? (
              displayGenre.slice(0, 2).map((g, idx) => (
                <Badge key={idx} variant="outline" className="text-xs border-gray-300 text-blue-600">
                  {g}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-xs border-gray-300 text-blue-600">
                {displayGenre}
              </Badge>
            )}
            {Array.isArray(displayGenre) && displayGenre.length > 2 && (
              <Badge variant="outline" className="text-xs border-gray-300 text-gray-500">
                +{displayGenre.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Status Message / CTA */}
        {status === 'draft' && (
          <div className="pt-2">
            <p className={`text-xs font-medium ${styles.ctaColor}`}>
              {t('titles:card.ctaContinueEditing')}
            </p>
          </div>
        )}

        {status === 'pending' && (
          <div className="pt-2">
            <p className={`text-xs font-medium ${styles.ctaColor}`}>
              {t('titles:card.ctaUnderReview')}
            </p>
          </div>
        )}

        {status === 'rejected' && (
          <div className="pt-2">
            <p className={`text-xs font-medium ${styles.ctaColor}`}>
              {t('titles:card.ctaClickDetails')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
