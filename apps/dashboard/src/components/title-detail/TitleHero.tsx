import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Title, titlesService } from '@/services/titlesService';
import { Icon } from '@iconify/react';

interface TitleHeroProps {
  title: Title;
  isFavorited: boolean;
  favoriteLoading: boolean;
  onFavoriteToggle: () => void;
}

export function TitleHero({
  title,
  isFavorited,
  favoriteLoading,
  onFavoriteToggle,
}: TitleHeroProps) {
  const hasRating = title.rating != null && title.rating > 0;
  const hasRatingCount = title.rating_count != null && title.rating_count > 0;

  return (
    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
      {/* Image Section */}
      <div className="flex-shrink-0">
        {/* Mobile: Full width image */}
        <div className="sm:hidden w-full h-56 bg-gray-100 rounded-xl overflow-hidden shadow-xl ring-1 ring-gray-200 relative">
          {title.title_image ? (
            <img
              src={title.title_image}
              alt={title.title_name_en || title.title_name_kr || 'Title'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#4C9C9B]/10 to-[#4C9C9B]/20 flex items-center justify-center">
              <Icon icon="solar:book-bold-duotone" className="w-12 h-12 text-[#4C9C9B]" />
            </div>
          )}
          {title.verified && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                <Icon icon="solar:check-circle-bold-duotone" className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>
          )}
        </div>

        {/* Desktop: Side image */}
        <div className="hidden sm:block w-36 h-52 bg-gray-100 rounded-xl overflow-hidden shadow-xl ring-1 ring-gray-200 relative">
          {title.title_image ? (
            <img
              src={title.title_image}
              alt={title.title_name_en || title.title_name_kr || 'Title'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#4C9C9B]/10 to-[#4C9C9B]/20 flex items-center justify-center">
              <Icon icon="solar:book-bold-duotone" className="w-10 h-10 text-[#4C9C9B]" />
            </div>
          )}
          {title.verified && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5">
                <Icon icon="solar:check-circle-bold-duotone" className="w-2.5 h-2.5 mr-0.5" />
                Verified
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0">
        {/* Title and Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-black leading-tight">
            {title.title_name_en || title.title_name_kr}
          </h1>
          {title.priority === '1' && (
            <Badge className="bg-[#4C9C9B] text-white text-xs">HIGH PRIORITY</Badge>
          )}
        </div>

        {/* Korean title */}
        {title.title_name_kr && title.title_name_en && (
          <p className="text-lg text-gray-600 font-medium mb-3">
            {title.title_name_kr}
          </p>
        )}

        {/* Rating display */}
        {hasRating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full">
              <Icon icon="solar:star-bold-duotone" className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-amber-700">{title.rating?.toFixed(1)}</span>
            </div>
            {hasRatingCount && (
              <span className="text-sm text-gray-500">
                ({titlesService.formatNumber(title.rating_count)} ratings)
              </span>
            )}
          </div>
        )}

        {/* Author info */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
          {title.story_author && (
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-[#4C9C9B]">Story:</span>
              <span className="font-medium">{title.story_author}</span>
            </span>
          )}
          {title.art_author && (
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-[#4C9C9B]">Art:</span>
              <span className="font-medium">{title.art_author}</span>
            </span>
          )}
          {title.original_author && !title.story_author && (
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-[#4C9C9B]">Author:</span>
              <span className="font-medium">{title.original_author}</span>
            </span>
          )}
        </div>

        {/* Format, Genre, Status */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-4">
          {title.content_format && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-medium">
              {title.content_format.replace('_', ' ')}
            </Badge>
          )}
          {title.genre && Array.isArray(title.genre) && title.genre.slice(0, 3).map((g, idx) => (
            <Badge key={idx} variant="outline" className="border-gray-300 text-gray-600">
              {g.replace('_', ' ')}
            </Badge>
          ))}
          {title.age_rating && (
            <Badge variant="outline" className="border-red-300 text-red-600">
              {title.age_rating}
            </Badge>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {title.views != null && (
            <div className="flex items-center gap-1.5">
              <Icon icon="solar:eye-bold-duotone" className="h-4 w-4" />
              <span className="font-medium">
                {title.views === 0 ? 'Not Available' : `${titlesService.formatNumber(title.views)} views`}
              </span>
            </div>
          )}
          {title.likes != null && (
            <div className="flex items-center gap-1.5">
              <Icon icon="solar:like-bold-duotone" className="h-4 w-4" />
              <span className="font-medium">{titlesService.formatNumber(title.likes)} likes</span>
            </div>
          )}
          {title.chapters != null && (
            <div className="flex items-center gap-1.5">
              <Icon icon="solar:book-bold-duotone" className="h-4 w-4" />
              <span className="font-medium">{title.chapters.toLocaleString()} chapters</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Icon icon="solar:calendar-bold-duotone" className="h-4 w-4" />
            <span className="font-medium">{title.completed ? 'Completed' : 'Ongoing'}</span>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
        <Button
          id="title-detail-favorite-toggle-btn"
          onClick={onFavoriteToggle}
          disabled={favoriteLoading}
          variant="outline"
          className={`flex-1 lg:flex-none border-gray-200 hover:bg-[#4C9C9B]/5 hover:border-[#4C9C9B]/30 px-4 py-2 transition-colors ${
            isFavorited ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' : ''
          }`}
        >
          <Icon icon="solar:heart-bold-duotone" className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
          {isFavorited ? 'Saved' : 'Save'}
        </Button>

        {(title.title_url || title.title_url_en) && (
          <Button
            variant="outline"
            className="flex-1 lg:flex-none border-gray-200 hover:bg-[#4C9C9B]/5 hover:border-[#4C9C9B]/30 px-4 py-2 transition-colors"
            onClick={() => window.open(title.title_url_en || title.title_url, '_blank')}
          >
            <Icon icon="solar:square-arrow-right-up-bold-duotone" className="h-4 w-4 mr-2" />
            View Original
          </Button>
        )}
      </div>
    </div>
  );
}
