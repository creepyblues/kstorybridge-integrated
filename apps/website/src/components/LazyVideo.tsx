import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

interface LazyVideoProps {
  videoId: string;
  title?: string;
  thumbnailQuality?: 'default' | 'medium' | 'high' | 'standard' | 'maxres';
  className?: string;
}

/**
 * LazyVideo - Lazy-loaded YouTube embed
 *
 * Shows a thumbnail with play button initially.
 * Only loads the YouTube iframe when:
 * 1. The component enters the viewport, AND
 * 2. User clicks the play button
 *
 * This significantly improves page load performance by:
 * - Not loading YouTube's ~500KB iframe bundle on page load
 * - Using a lightweight thumbnail image instead
 * - Only loading the iframe when user intends to watch
 */
export const LazyVideo = ({
  videoId,
  title = 'Video',
  thumbnailQuality = 'maxres',
  className = '',
}: LazyVideoProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use Intersection Observer to detect when video enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${thumbnailQuality}default.jpg`;

  const handleClick = () => {
    setIsLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl shadow-lg overflow-hidden ${className}`}
      style={{ paddingBottom: '56.25%' }}
    >
      {isLoaded ? (
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          onClick={handleClick}
          className="absolute top-0 left-0 w-full h-full cursor-pointer group focus:outline-none focus:ring-4 focus:ring-hanok-teal/50"
          aria-label={`Play ${title}`}
        >
          {/* Thumbnail */}
          {isInView && (
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute top-0 left-0 w-full h-full object-cover"
              loading="lazy"
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-hanok-teal rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-hanok-teal-600 transition-all duration-300">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" fill="currentColor" />
            </div>
          </div>

          {/* "Watch Video" text */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
              Watch Video
            </span>
          </div>
        </button>
      )}
    </div>
  );
};

export default LazyVideo;
