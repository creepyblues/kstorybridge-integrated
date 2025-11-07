import React from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@kstorybridge/ui';
import { useTitlesWithPitch } from '@/hooks/useAssetGeneration';
import type { TitleWithPitch } from '@/types/asset-generation';

interface TitleSelectorProps {
  selectedTitleId: string | null;
  onSelectTitle: (title: TitleWithPitch | null) => void;
  className?: string;
}

/**
 * TitleSelector Component
 * Dropdown to select titles that have pitch analysis data
 */
export function TitleSelector({ selectedTitleId, onSelectTitle, className }: TitleSelectorProps) {
  const { data: titles, isLoading, error } = useTitlesWithPitch();

  const handleValueChange = (titleId: string) => {
    const title = titles?.find((t) => t.title_id === titleId);
    if (title) {
      onSelectTitle(title);
    }
  };

  const displayName = (title: TitleWithPitch) => {
    return title.title_name_en || title.title_name_kr || 'Untitled';
  };

  if (error) {
    return (
      <div className={className}>
        <div className="text-sm text-red-500">
          Error loading titles: {error.message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Loading titles..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={selectedTitleId || undefined} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select a title..." />
      </SelectTrigger>
      <SelectContent>
        {titles?.map((title) => (
          <SelectItem key={title.title_id} value={title.title_id}>
            <div className="flex flex-col">
              <span className="font-medium text-black">{displayName(title)}</span>
              {title.title_name_en && title.title_name_kr && (
                <span className="text-xs text-gray-500">{title.title_name_kr}</span>
              )}
              {title.views && (
                <span className="text-xs text-gray-400">{title.views.toLocaleString()} views</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
