import { FileText } from 'lucide-react';
import { Title } from '@/services/titlesService';

interface TitleMetadataProps {
  title: Title;
  compact?: boolean;
}

const formatNumber = (num?: number): string => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function TitleMetadata({ title, compact = false }: TitleMetadataProps) {
  return (
    <div className="space-y-2">
      {/* Genre and Format Badges */}
      <div className="flex flex-wrap gap-2">
        {title.genre && (
          <span className={`px-2 py-0.5 bg-gray-100 text-gray-700 rounded ${compact ? 'text-xs' : 'text-xs'}`}>
            {title.genre}
          </span>
        )}
        {title.content_format && (
          <span className={`px-2 py-0.5 bg-gray-100 text-gray-700 rounded ${compact ? 'text-xs' : 'text-xs'}`}>
            {title.content_format}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className={`flex items-center gap-3 text-gray-500 ${compact ? 'text-xs' : 'text-xs'}`}>
        {title.views !== undefined && (
          <span>👁️ {formatNumber(title.views)}</span>
        )}
        {title.rating != null && (
          <span>⭐ {title.rating.toFixed(1)}</span>
        )}
        {title.pitch && (
          <span className={`flex items-center gap-1 text-pro-purple ${compact ? 'font-normal' : 'font-medium'}`}>
            {compact && <FileText className="h-3 w-3" />}
            {compact ? 'Pitch' : 'Pitch Available'}
          </span>
        )}
      </div>
    </div>
  );
}
