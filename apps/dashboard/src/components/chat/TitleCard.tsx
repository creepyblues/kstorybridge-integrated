import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

interface TitleCardProps {
  title: {
    id: string;
    slug?: string;
    nameEn?: string;
    nameKr?: string;
    genre?: string;
    format?: string;
    views?: number;
    rating?: number;
    image?: string;
    hasPitch?: boolean;
    similarity?: number;
  };
}

export function TitleCard({ title }: TitleCardProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/buyers/titles/${title.slug || title.id}`);
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="hover:border-hanok-teal transition-colors cursor-pointer" onClick={handleViewDetails}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Image */}
          {title.image && (
            <div className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={title.image}
                alt={title.nameEn || title.nameKr || 'Title'}
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
              {title.nameEn || title.nameKr}
            </h3>
            {title.nameKr && title.nameEn && (
              <p className="text-xs text-gray-500 mb-2 truncate">{title.nameKr}</p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
              {title.genre && (
                <span className="bg-gray-100 px-2 py-0.5 rounded">{title.genre}</span>
              )}
              {title.format && (
                <span className="bg-gray-100 px-2 py-0.5 rounded">{title.format}</span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {title.views !== undefined && (
                <span>👁️ {formatNumber(title.views)}</span>
              )}
              {title.rating != null && (
                <span>⭐ {title.rating.toFixed(1)}</span>
              )}
              {title.hasPitch && (
                <span className="flex items-center gap-1 text-pro-purple">
                  <Icon icon="solar:document-text-bold-duotone" className="h-3 w-3" />
                  Pitch
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex-shrink-0 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
            >
              <Icon icon="solar:square-arrow-right-up-bold-duotone" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
