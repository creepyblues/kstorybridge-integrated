import { useState } from 'react'
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
  const [isHovered, setIsHovered] = useState(false)

  // Determine data source
  const displayData = title || draft?.draft_data
  const displayTitle = displayData?.title_name_en || displayData?.title_name_kr || 'Untitled'
  const displayKoreanTitle = displayData?.title_name_kr
  const displayAuthor = title?.story_author
  const displayImage = displayData?.title_image
  const displayGenre = title?.genre
  const displayViews = title?.views
  const displayChapters = title?.chapters

  // Status-based styling
  const getStatusStyles = () => {
    switch (status) {
      case 'draft':
        return {
          border: 'border-amber-400 border-2 hover:border-amber-500',
          gradient: 'from-amber-50 to-amber-100',
          icon: FileEdit,
          iconColor: 'text-amber-500',
          badgeColor: 'bg-amber-500 text-white',
          badgeText: 'DRAFT',
          ctaColor: 'text-amber-600'
        }
      case 'pending':
        return {
          border: 'border-blue-400 border-2 hover:border-blue-500',
          gradient: 'from-blue-50 to-blue-100',
          icon: Clock,
          iconColor: 'text-blue-500',
          badgeColor: 'bg-blue-500 text-white',
          badgeText: 'PENDING APPROVAL',
          ctaColor: 'text-blue-600'
        }
      case 'rejected':
        return {
          border: 'border-red-400 border-2 hover:border-red-500',
          gradient: 'from-red-50 to-red-100',
          icon: FileEdit,
          iconColor: 'text-red-500',
          badgeColor: 'bg-red-500 text-white',
          badgeText: 'REJECTED',
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

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return saved.toLocaleDateString()
  }

  return (
    <Card
      className={`group cursor-pointer transition-colors duration-200 bg-transparent shadow-none rounded-2xl overflow-hidden ${styles.border}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Image Container - 3:4 aspect ratio like dashboard */}
      <div className={`relative aspect-[3/4] overflow-hidden bg-gradient-to-br ${styles.gradient}`}>
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
            <Badge className={`${styles.badgeColor} border-0 shadow-sm`}>
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
          <h3 className="text-lg font-bold text-black line-clamp-1 mb-1">
            {displayTitle}
          </h3>
          {displayKoreanTitle && displayData?.title_name_en && (
            <p className="text-sm text-gray-600 line-clamp-1">
              {displayKoreanTitle}
            </p>
          )}
          {displayAuthor && (
            <p className="text-sm text-gray-600">
              by {displayAuthor}
            </p>
          )}
        </div>

        {/* Draft Progress */}
        {status === 'draft' && currentStep && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <BookOpen className="h-3 w-3" />
            <span>Step {currentStep} of 5</span>
          </div>
        )}

        {/* Last Saved (drafts) */}
        {status === 'draft' && lastSaved && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Last saved: {formatLastSaved(lastSaved)}</span>
          </div>
        )}

        {/* Submitted Timestamp (pending) */}
        {status === 'pending' && submittedAt && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Submitted: {formatLastSaved(submittedAt)}</span>
          </div>
        )}

        {/* Rejection Reason */}
        {status === 'rejected' && rejectionReason && (
          <div className="text-xs text-gray-700 line-clamp-2">
            <span className="font-semibold">Reason:</span> {rejectionReason}
          </div>
        )}

        {/* Rejected Timestamp */}
        {status === 'rejected' && rejectedAt && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Rejected: {formatLastSaved(rejectedAt)}</span>
          </div>
        )}

        {/* Stats (approved titles only) */}
        {status === 'approved' && (displayViews !== undefined || displayChapters !== undefined) && (
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {displayViews !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{formatViews(displayViews)} views</span>
              </div>
            )}
            {displayChapters && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>{displayChapters} chapters</span>
              </div>
            )}
          </div>
        )}

        {/* Genre Badge (approved only) */}
        {status === 'approved' && displayGenre && (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(displayGenre) ? (
              displayGenre.slice(0, 2).map((g, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {g}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary" className="text-xs">
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
              Click to continue editing →
            </p>
          </div>
        )}

        {status === 'pending' && (
          <div className="pt-2">
            <p className={`text-xs font-medium ${styles.ctaColor}`}>
              Under admin review
            </p>
          </div>
        )}

        {status === 'rejected' && (
          <div className="pt-2">
            <p className={`text-xs font-medium ${styles.ctaColor}`}>
              Click for details →
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
