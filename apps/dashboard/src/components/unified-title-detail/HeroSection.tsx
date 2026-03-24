import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Star, BookOpen, CheckCircle, Bookmark } from 'lucide-react';
import { type UnifiedTitleDetailProps, formatLabel } from './types';

interface HeroSectionProps extends Pick<UnifiedTitleDetailProps, 'title' | 'authState' | 'user' | 'isFavorited' | 'favoriteLoading' | 'onFavoriteToggle' | 'onCtaClick'> {}

export function HeroSection({
  title,
  authState,
  isFavorited,
  favoriteLoading,
  onFavoriteToggle,
  onCtaClick,
}: HeroSectionProps) {
  const isLoggedIn = authState === 'authenticated';
  const genres = title.genre
    ? (Array.isArray(title.genre) ? title.genre : [title.genre])
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
      {/* Cover Image */}
      <div className="md:col-span-2">
        {title.title_image ? (
          <img
            src={title.title_image}
            alt={title.title_name_en || title.title_name_kr}
            className="w-full rounded-2xl object-cover shadow-lg"
          />
        ) : (
          <div className="w-full aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}
      </div>

      {/* Title Info */}
      <div className="md:col-span-3 flex flex-col justify-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
          {title.title_name_en || title.title_name_kr}
        </h1>
        {title.title_name_en && title.title_name_kr && (
          <p className="text-lg text-gray-500 mb-4">{title.title_name_kr}</p>
        )}

        {title.story_author && (
          <p className="text-gray-600 mb-4">
            <span className="font-medium">Story</span> {title.story_author}
            {title.art_author && title.art_author !== title.story_author && (
              <> &middot; <span className="font-medium">Art</span> {title.art_author}</>
            )}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          {genres.map(g => (
            <Badge key={g} variant="outline" className="border-gray-300 text-gray-700">
              {formatLabel(g)}
            </Badge>
          ))}
          {title.content_format && (
            <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-50">
              {formatLabel(title.content_format)}
            </Badge>
          )}
          {title.age_rating && (
            <Badge variant="outline" className="border-gray-300 text-gray-600">
              {title.age_rating}
            </Badge>
          )}
        </div>

        {/* Comp line */}
        {title.comps && title.comps.length >= 2 && (
          <p className="text-gray-700 italic mb-5">
            Think: {title.comps.slice(0, 3).join(' meets ')}
          </p>
        )}

        {/* Metrics */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
          {title.views != null && title.views > 0 && (
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" /> {title.views.toLocaleString()} views
            </span>
          )}
          {title.rating != null && title.rating_count != null && title.rating_count > 0 && (
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4" /> {title.rating.toFixed(1)} ({title.rating_count.toLocaleString()})
            </span>
          )}
          {title.chapters != null && title.chapters > 0 && (
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> {title.chapters} chapters
              {title.completed && ' (Complete)'}
            </span>
          )}
        </div>

        {/* Rights badges */}
        {title.rights_available && title.rights_available.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {title.rights_available.map(r => (
              <Badge key={r} className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" /> {formatLabel(r)}
              </Badge>
            ))}
          </div>
        )}

        {title.tagline && (
          <p className="text-lg text-gray-800 font-medium mb-6">"{title.tagline}"</p>
        )}

        {/* Primary CTA */}
        {isLoggedIn ? (
          <div className="flex flex-wrap gap-3">
            {onFavoriteToggle && (
              <Button
                variant="outline"
                className="border-gray-300 hover:bg-gray-100 rounded-full px-6 py-3 text-base font-medium"
                onClick={onFavoriteToggle}
                disabled={favoriteLoading}
              >
                <Bookmark className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Saved' : 'Save'}
              </Button>
            )}
          </div>
        ) : (
          <div>
            <Link to="/signup" onClick={() => onCtaClick?.('hero')}>
              <Button className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium">
                Unlock Full Analysis — Free for Producers
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-2">
              <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
              Free for producers &middot; Takes 30 seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
