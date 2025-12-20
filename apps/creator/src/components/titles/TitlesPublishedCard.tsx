import { Icon } from '@iconify/react'
import { Title } from '@/services/titlesService'

interface TitlesPublishedCardProps {
  title: Title
  onClick?: () => void
}

function formatViews(views: number | null | undefined): string {
  if (!views) return '0'
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
  return views.toString()
}

export function TitlesPublishedCard({ title, onClick }: TitlesPublishedCardProps) {
  const displayTitle = title.title_name_kr || title.title_name_en || 'Untitled'
  const genre = Array.isArray(title.genre) ? title.genre[0] : title.genre

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group"
    >
      {/* Cover Image - Portrait 3:4 */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 mb-2 border border-gray-200 group-hover:border-sunrise-coral/30 transition-colors">
        {title.title_image ? (
          <img
            src={title.title_image}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon icon="solar:book-bold-duotone" className="h-10 w-10 text-gray-300" />
          </div>
        )}

        {/* Published Badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-500 text-white shadow-sm">
            <Icon icon="solar:check-circle-bold" className="h-3 w-3" />
          </span>
        </div>

        {/* Stats overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <div className="flex gap-3 text-white text-xs">
            {title.views !== null && title.views !== undefined && (
              <span className="flex items-center gap-1">
                <Icon icon="solar:eye-linear" className="h-3.5 w-3.5" />
                {formatViews(title.views)}
              </span>
            )}
            {title.rating !== null && title.rating !== undefined && (
              <span className="flex items-center gap-1">
                <Icon icon="solar:star-linear" className="h-3.5 w-3.5" />
                {title.rating.toFixed(1)}
              </span>
            )}
            {title.chapters !== null && title.chapters !== undefined && (
              <span className="flex items-center gap-1">
                <Icon icon="solar:book-linear" className="h-3.5 w-3.5" />
                {title.chapters}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-sunrise-coral transition-colors">
        {displayTitle}
      </p>

      {/* Genre badge */}
      {genre && (
        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
          {genre}
        </span>
      )}
    </div>
  )
}
