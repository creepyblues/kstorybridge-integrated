/**
 * ManualCompSearch Component (Creator App)
 *
 * Search input with OMDB autocomplete for adding manual comps.
 * Used in CompsGeneratorModal to let users add Hollywood titles
 * that weren't suggested by AI.
 */

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';
import {
  useOMDBAutocomplete,
  createManualComp,
  type OMDBSearchResult,
  type SuggestedComp,
} from '@kstorybridge/tools';

interface ManualCompSearchProps {
  /** Callback when a comp is added */
  onAdd: (comp: SuggestedComp) => void;
  /** Set of already added imdbIDs to prevent duplicates */
  existingImdbIds: Set<string>;
  /** Whether the search is disabled */
  disabled?: boolean;
}

export function ManualCompSearch({
  onAdd,
  existingImdbIds,
  disabled = false,
}: ManualCompSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const apiKey = import.meta.env.VITE_OMDB_API_KEY;

  const {
    suggestions,
    isLoading,
    showDropdown,
    setShowDropdown,
    dropdownRef,
    focusedIndex,
    handleKeyDown,
    clearSuggestions,
  } = useOMDBAutocomplete(query, {
    apiKey,
    maxResults: 6,
    enabled: !disabled && !!apiKey,
  });

  const handleSelect = (result: OMDBSearchResult) => {
    // Check for duplicates
    if (existingImdbIds.has(result.imdbID)) {
      // Already added, just clear and focus
      setQuery('');
      clearSuggestions();
      inputRef.current?.focus();
      return;
    }

    // Convert to SuggestedComp and add
    const comp = createManualComp(result);
    onAdd(comp);

    // Reset search
    setQuery('');
    clearSuggestions();
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleKeyDown(e, handleSelect);
  };

  // Filter out already added titles from suggestions
  const filteredSuggestions = suggestions.filter(
    (s) => !existingImdbIds.has(s.imdbID)
  );

  if (!apiKey) {
    return (
      <div className="text-sm text-gray-400 italic text-center py-2">
        OMDB API key not configured - manual search unavailable
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Icon
          icon="solar:magnifer-bold-duotone"
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search IMDB titles to add..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            if (filteredSuggestions.length > 0) {
              setShowDropdown(true);
            }
          }}
          disabled={disabled}
          className="pl-9 pr-8"
        />
        {isLoading && (
          <Icon
            icon="solar:refresh-circle-bold-duotone"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin"
          />
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {filteredSuggestions.map((result, index) => {
            const isAlreadyAdded = existingImdbIds.has(result.imdbID);
            const isFocused = index === focusedIndex;

            return (
              <button
                key={result.imdbID}
                type="button"
                onClick={() => handleSelect(result)}
                disabled={isAlreadyAdded}
                className={`w-full flex items-center gap-3 p-2 text-left transition-colors ${
                  isFocused
                    ? 'bg-teal-50'
                    : isAlreadyAdded
                    ? 'bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Poster thumbnail */}
                <div className="w-10 h-14 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                  {result.Poster && result.Poster !== 'N/A' ? (
                    <img
                      src={result.Poster}
                      alt={result.Title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon
                        icon="solar:film-bold-duotone"
                        className="h-5 w-5 text-gray-300"
                      />
                    </div>
                  )}
                </div>

                {/* Title info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {result.Title}
                    </span>
                    {isAlreadyAdded && (
                      <span className="text-xs text-gray-400">(already added)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Icon
                      icon={
                        result.Type === 'series'
                          ? 'solar:tv-bold-duotone'
                          : 'solar:clapperboard-bold-duotone'
                      }
                      className="h-3.5 w-3.5"
                    />
                    <span>
                      {result.Year} &bull;{' '}
                      {result.Type === 'series' ? 'TV Series' : 'Film'}
                    </span>
                  </div>
                </div>

                {/* Add indicator */}
                {!isAlreadyAdded && (
                  <Icon
                    icon="solar:add-circle-bold-duotone"
                    className={`h-5 w-5 flex-shrink-0 ${
                      isFocused ? 'text-teal-500' : 'text-gray-300'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {showDropdown && query.length >= 2 && filteredSuggestions.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
          No titles found for "{query}"
        </div>
      )}
    </div>
  );
}

export default ManualCompSearch;
