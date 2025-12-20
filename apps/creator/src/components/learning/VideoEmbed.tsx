import { useState } from 'react'
import { Icon } from '@iconify/react'

interface VideoEmbedProps {
  url: string
  title?: string
}

export function VideoEmbed({ url, title = 'Video' }: VideoEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Extract video ID and platform from URL
  const getEmbedUrl = (videoUrl: string): string | null => {
    // YouTube patterns
    const youtubeMatch = videoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    )
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`
    }

    // Vimeo patterns
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?byline=0&portrait=0`
    }

    return null
  }

  const embedUrl = getEmbedUrl(url)

  if (!embedUrl) {
    return (
      <div className="aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
        <Icon icon="solar:video-frame-play-horizontal-bold-duotone" className="h-12 w-12 mb-2" />
        <p className="text-sm">Unable to embed this video</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
        >
          Open in new tab
          <Icon icon="solar:arrow-right-up-linear" className="h-4 w-4" />
        </a>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
        <Icon icon="solar:danger-triangle-bold-duotone" className="h-12 w-12 mb-2 text-red-400" />
        <p className="text-sm">Failed to load video</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
        >
          Watch on source site
          <Icon icon="solar:arrow-right-up-linear" className="h-4 w-4" />
        </a>
      </div>
    )
  }

  return (
    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Icon icon="solar:spinner-bold" className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      )}
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
    </div>
  )
}
