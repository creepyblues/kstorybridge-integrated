import { useState } from "react";
import { Button, Card, CardContent } from "@kstorybridge/ui";

import { 
  Heart, 
  Eye, 
  Star, 
  BookOpen,
  ExternalLink,
  PlayCircle 
} from "lucide-react";

interface TitleCardProps {
  title: {
    id: string;
    title_name_en?: string;
    title_name_kr: string;
    genre?: string | string[];
    author?: string;
    synopsis?: string;
    title_image?: string;
    rating?: number;
    views?: number;
    likes?: number;
    content_format?: string;
    tags?: string[];
  };
  onFavorite?: (titleId: string) => void;
  onView?: (titleId: string) => void;
  isFavorited?: boolean;
  showActions?: boolean;
}

export function TitleCard({ 
  title, 
  onFavorite, 
  onView, 
  isFavorited = false, 
  showActions = true 
}: TitleCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayTitle = title.title_name_en || title.title_name_kr;
  const imageUrl = title.title_image || "/placeholder-cover.jpg";

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(title.id);
  };

  const handleView = () => {
    onView?.(title.id);
  };

  const getFormatColor = (format?: string) => {
    switch (format?.toLowerCase()) {
      case 'webtoon':
        return 'bg-hanok-teal text-snow-white';
      case 'webnovel':
        return 'bg-sunrise-coral text-snow-white';
      case 'video':
        return 'bg-porcelain-blue-600 text-snow-white';
      default:
        return 'bg-warm-sand text-midnight-ink';
    }
  };

  return (
    <Card 
      className={`group cursor-pointer transition-shadow duration-200 hover:shadow-xl
        bg-snow-white border-porcelain-blue-200 overflow-hidden
        ${isHovered ? 'shadow-2xl' : 'shadow-md'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleView}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-porcelain-blue-100 to-warm-sand-200">
        <img 
          src={imageUrl}
          alt={displayTitle}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder-cover.jpg";
          }}
        />
        
        {/* Overlay with play button for videos */}
        {title.content_format?.toLowerCase() === 'video' && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <PlayCircle className="h-12 w-12 text-snow-white" />
          </div>
        )}

        {/* Format badge */}
        {title.content_format && (
          <Badge className={`absolute top-3 left-3 ${getFormatColor(title.content_format)} border-0 shadow-lg`}>
            {title.content_format}
          </Badge>
        )}

        {/* Favorite button */}
        {showActions && (
          <Button
            id="dashboard-title-favorite-btn"
            size="sm"
            variant="ghost"
            className={`absolute top-3 right-3 h-8 w-8 p-0 rounded-full transition-all
              ${isFavorited 
                ? 'bg-sunrise-coral text-snow-white hover:bg-sunrise-coral-600' 
                : 'bg-snow-white/80 text-midnight-ink hover:bg-snow-white'}`}
            onClick={handleFavorite}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
          </Button>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title and Author */}
        <div>
          <h3 className="font-bold text-midnight-ink line-clamp-2 mb-1 group-hover:text-hanok-teal transition-colors duration-200 will-change-auto">
            {displayTitle}
          </h3>
          {title.author && (
            <p className="text-sm text-midnight-ink-600 font-medium">
              by {title.author}
            </p>
          )}
        </div>

        {/* Genre */}
        {title.genre && (Array.isArray(title.genre) ? title.genre.length > 0 : true) && (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(title.genre) ? (
              title.genre.slice(0, 2).map((g, idx) => (
                <Badge key={`${title.title_id}-genre-${idx}`} variant="outline" className="text-xs border-porcelain-blue-300 text-hanok-teal">
                  {g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-xs border-porcelain-blue-300 text-hanok-teal">
                {title.genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            )}
            {Array.isArray(title.genre) && title.genre.length > 2 && (
              <Badge variant="outline" className="text-xs border-gray-300 text-gray-500">
                +{title.genre.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Synopsis */}
        {title.synopsis && (
          <p className="text-sm text-midnight-ink-700 line-clamp-2 leading-relaxed">
            {title.synopsis}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-sm text-midnight-ink-600">
            {title.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-sunrise-coral fill-current" />
                <span className="font-medium">{title.rating.toFixed(1)}</span>
              </div>
            )}
            
            {title.views !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-hanok-teal" />
                <span>{title.views.toLocaleString()}</span>
              </div>
            )}
            
            {title.likes !== undefined && (
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-sunrise-coral" />
                <span>{title.likes.toLocaleString()}</span>
              </div>
            )}
          </div>

          {showActions && (
            <Button
              id="dashboard-title-view-details-btn"
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-midnight-ink-600 hover:text-hanok-teal hover:bg-porcelain-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                // Handle view details
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Tags */}
        {title.tags && title.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {title.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-warm-sand text-midnight-ink border-0 hover:bg-warm-sand-400"
              >
                {tag}
              </Badge>
            ))}
            {title.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-warm-sand-300 text-midnight-ink-600 border-0">
                +{title.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}