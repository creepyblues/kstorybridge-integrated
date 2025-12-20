import { Icon } from '@iconify/react'
import { Card } from '@/components/ui/card'

interface LearningCardEnhancedProps {
  title: string
  excerpt: string
  featuredImageUrl?: string
  authorName: string
  publishedAt: string | null
  tags?: string[] | null
  videoUrl?: string | null
  readingTime?: number
  isCompleted?: boolean
  onClick?: () => void
}

export function LearningCardEnhanced({
  title,
  excerpt,
  featuredImageUrl,
  authorName,
  publishedAt,
  tags,
  videoUrl,
  readingTime,
  isCompleted = false,
  onClick,
}: LearningCardEnhancedProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const hasVideo = !!videoUrl

  return (
    <Card
      className="group bg-white border-gray-200 shadow-none rounded-2xl hover:border-sunrise-coral/30 transition-all cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Thumbnail / Image Section */}
      <div className="relative aspect-video bg-gradient-to-br from-sunrise-coral/5 to-orange-100">
        {featuredImageUrl ? (
          <img
            src={featuredImageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon
              icon="solar:book-2-bold-duotone"
              className="h-12 w-12 text-sunrise-coral/50"
            />
          </div>
        )}

        {/* Video Play Button Overlay */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-3 rounded-full bg-white/90 shadow-lg">
              <Icon icon="solar:play-bold" className="h-6 w-6 text-sunrise-coral" />
            </div>
          </div>
        )}

        {/* Content Type Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
              hasVideo
                ? 'bg-sunrise-coral text-white'
                : 'bg-white/90 text-gray-700'
            }`}
          >
            <Icon
              icon={hasVideo ? 'solar:video-frame-bold' : 'solar:document-text-bold'}
              className="h-3 w-3"
            />
            {hasVideo ? 'Video' : 'Article'}
          </span>
        </div>

        {/* Completion Badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-500 text-white">
              <Icon icon="solar:check-circle-bold" className="h-3 w-3" />
              Completed
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs font-medium rounded-full bg-sunrise-coral/10 text-sunrise-coral"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-sunrise-coral transition-colors">
          {title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{excerpt}</p>

        {/* Meta Row */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>{authorName}</span>
            {publishedAt && (
              <>
                <span>•</span>
                <span>{formatDate(publishedAt)}</span>
              </>
            )}
          </div>
          {readingTime && (
            <div className="flex items-center gap-1">
              <Icon icon="solar:clock-circle-linear" className="h-3 w-3" />
              <span>{readingTime} min</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
