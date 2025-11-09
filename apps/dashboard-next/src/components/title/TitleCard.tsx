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

  // Grid variant (default)
  return (
    <Card
      className="hover:border-hanok-teal transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        {/* Image */}
        {title.title_image && (
          <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 mb-3">
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

        {/* Title */}
        <h3 className="font-semibold text-black text-base mb-1 line-clamp-2">
          {title.title_name_en || title.title_name_kr}
        </h3>
        {title.title_name_kr && title.title_name_en && (
          <p className="text-sm text-gray-500 mb-2 line-clamp-1">
            {title.title_name_kr}
          </p>
        )}

        {/* Synopsis */}
        {title.synopsis && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {title.synopsis}
          </p>
        )}

        <TitleMetadata title={title} />

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
            className="w-full mt-3 border-red-300 text-red-600 hover:bg-red-50"
          >
            <Heart className="h-4 w-4 mr-1 fill-current" />
            {removing ? 'Removing...' : 'Remove'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
