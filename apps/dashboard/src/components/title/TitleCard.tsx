import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Title } from '@/services/titlesService';
import { TitleMetadata } from './TitleMetadata';

// Chat service title format
interface ChatTitle {
  id: string;
  nameEn?: string;
  nameKr?: string;
  genre?: string;
  format?: string;
  views?: number;
  rating?: number;
  image?: string;
  hasPitch?: boolean;
  similarity?: number;
}

interface TitleCardProps {
  title: Title | ChatTitle;
  variant?: 'compact' | 'grid';
  onRemove?: (titleId: string) => void;
  removing?: boolean;
}

// Helper to normalize title format
function normalizeTitle(title: Title | ChatTitle): Title {
  if ('title_id' in title) {
    return title as Title;
  }

  // Convert ChatTitle to Title format
  const chatTitle = title as ChatTitle;
  return {
    title_id: chatTitle.id,
    title_name_en: chatTitle.nameEn,
    title_name_kr: chatTitle.nameKr,
    genre: chatTitle.genre,
    content_format: chatTitle.format,
    views: chatTitle.views,
    rating: chatTitle.rating,
    title_image: chatTitle.image,
    pitch: chatTitle.hasPitch ? 'has_pitch' : undefined,
  } as Title;
}

export function TitleCard({ title: rawTitle, variant = 'grid', onRemove, removing = false }: TitleCardProps) {
  const navigate = useNavigate();
  const title = normalizeTitle(rawTitle);

  const handleClick = () => {
    navigate(`/buyers/titles/${title.title_id}`);
  };

  if (variant === 'compact') {
    return (
      <Card
        className="hover:border-hanok-teal transition-colors cursor-pointer"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex gap-3">
            {/* Image */}
            {title.title_image && (
              <div className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={title.title_image}
                  alt={title.title_name_en || title.title_name_kr || 'Title'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-black text-sm mb-1 truncate">
                {title.title_name_en || title.title_name_kr}
              </h3>
              {title.title_name_kr && title.title_name_en && (
                <p className="text-xs text-gray-500 mb-2 truncate">{title.title_name_kr}</p>
              )}

              <TitleMetadata title={title} compact />
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid variant (default) - inspired by comps-navigator design
  return (
    <Card
      className="bg-white border border-gray-300 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Image Section with Hover Zoom */}
        <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
          {title.title_image ? (
            <img
              src={title.title_image}
              alt={title.title_name_en || title.title_name_kr || 'Title'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x600?text=No+Image';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          {/* Rating Badge - Absolute positioned (if available) */}
          {title.rating && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm">
              ★ {title.rating}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 md:p-6 flex flex-col overflow-hidden">
          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-hanok-teal transition-colors">
            {title.title_name_en || title.title_name_kr}
          </h3>
          {title.title_name_kr && title.title_name_en && (
            <p className="text-sm text-gray-500 mb-3 truncate">{title.title_name_kr}</p>
          )}

          {/* Divider */}
          <div className="w-full h-px bg-gray-300 mb-3"></div>

          {/* Genre and Format Tags */}
          <div className="flex flex-wrap gap-2 mb-3 max-w-full">
            {title.genre && typeof title.genre === 'string' && (
              <span className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-1 rounded-md text-xs font-medium border border-cyan-200">
                {title.genre}
              </span>
            )}
            {Array.isArray(title.genre) && title.genre.slice(0, 3).map((g, idx) => (
              <span
                key={idx}
                className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-1 rounded-md text-xs font-medium border border-cyan-200"
              >
                {g}
              </span>
            ))}
            {title.tone && (
              <span className="bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 px-2 py-1 rounded-md text-xs font-medium border border-purple-200">
                {title.tone}
              </span>
            )}
            {title.content_format && (
              <span className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-2 py-1 rounded-md text-xs font-medium border border-blue-200">
                {title.content_format}
              </span>
            )}
          </div>

          {/* Synopsis */}
          {title.synopsis && (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-3 break-words">
              {title.synopsis}
            </p>
          )}

          {/* Creator Info */}
          {(title.story_author || title.art_author) && (
            <div className="text-xs text-gray-500 mb-3">
              {title.story_author && (
                <div>Story: {title.story_author}</div>
              )}
              {title.art_author && title.art_author !== title.story_author && (
                <div>Art: {title.art_author}</div>
              )}
            </div>
          )}

          {/* Remove Button (if onRemove provided) */}
          {onRemove && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(title.title_id);
              }}
              disabled={removing}
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              <Heart className="h-4 w-4 mr-1 fill-current" />
              {removing ? 'Removing...' : 'Remove'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
