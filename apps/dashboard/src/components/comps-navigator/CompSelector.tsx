/**
 * CompSelector Component
 *
 * Allows users to input 1-3 comparable titles for search.
 * Features OMDB-powered autocomplete with IMDB verification.
 * Displays comps as removable chips with IMDB links.
 */

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { omdbService, OMDBSearchResult } from '@/services/omdbService';

// Exported type for use in parent components
export interface CompTitle {
  title: string;
  imdbID: string;
  year: string;
  type: 'movie' | 'series' | 'episode';
  poster?: string;
}

interface CompSelectorProps {
  compTitles: CompTitle[];
  onChange: (titles: CompTitle[]) => void;
  maxComps?: number;
}

export default function CompSelector({ compTitles, onChange, maxComps = 3 }: CompSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<OMDBSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search effect
  useEffect(() => {
    const trimmed = inputValue.trim();

    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const results = await omdbService.searchTitles(trimmed);
      // Deduplicate by imdbID to avoid React key warnings
      const uniqueResults = results.filter(
        (result, index, self) => self.findIndex(r => r.imdbID === result.imdbID) === index
      );
      setSuggestions(uniqueResults.slice(0, 6)); // Max 6 suggestions
      setShowDropdown(uniqueResults.length > 0);
      setIsLoading(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelectSuggestion = (result: OMDBSearchResult) => {
    if (compTitles.length >= maxComps) return;

    // Check for duplicates by IMDB ID
    if (compTitles.some(c => c.imdbID === result.imdbID)) {
      setInputValue('');
      setShowDropdown(false);
      return;
    }

    const newComp: CompTitle = {
      title: result.Title,
      imdbID: result.imdbID,
      year: result.Year,
      type: result.Type,
      poster: result.Poster !== 'N/A' ? result.Poster : undefined,
    };

    onChange([...compTitles, newComp]);
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleAddManual = () => {
    const trimmed = inputValue.trim();

    if (!trimmed || compTitles.length >= maxComps) return;

    // Check for duplicates by title (case-insensitive)
    if (compTitles.some(c => c.title.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('');
      return;
    }

    // Add as manual entry (no IMDB data)
    const newComp: CompTitle = {
      title: trimmed,
      imdbID: '',
      year: '',
      type: 'movie' // Default
    };

    onChange([...compTitles, newComp]);
    setInputValue('');
    setShowDropdown(false);
  };

  const handleRemoveComp = (index: number) => {
    const newTitles = compTitles.filter((_, i) => i !== index);
    onChange(newTitles);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If dropdown is open and has suggestions, select the first one
      if (showDropdown && suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        handleAddManual();
      }
    }
  };

  const canAddMore = compTitles.length < maxComps;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-hanok-teal">
          Select up to {maxComps} comparable titles
        </label>
        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
          {compTitles.length} / {maxComps}
        </span>
      </div>

      {/* Comp Chips */}
      {compTitles.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {compTitles.map((comp, index) => (
            <div
              key={comp.imdbID || index}
              className="inline-flex items-center gap-3 p-2 bg-gradient-to-r from-hanok-teal/10 to-hanok-teal/5 border border-hanok-teal/30 rounded-xl text-sm font-medium text-hanok-teal shadow-sm"
            >
              {/* Poster thumbnail */}
              <div className="w-[40px] h-[56px] flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                {comp.poster ? (
                  <img
                    src={comp.poster}
                    alt={comp.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {comp.type === 'series' ? (
                      <Icon icon="solar:tv-bold-duotone" className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Icon icon="solar:clapperboard-bold-duotone" className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  {comp.type === 'series' ? (
                    <Icon icon="solar:tv-bold-duotone" className="h-3.5 w-3.5 text-hanok-teal/70" />
                  ) : (
                    <Icon icon="solar:clapperboard-bold-duotone" className="h-3.5 w-3.5 text-hanok-teal/70" />
                  )}
                  <span>{comp.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {comp.year && (
                    <span className="text-hanok-teal/60 text-xs">{comp.year}</span>
                  )}
                  {comp.imdbID && (
                    <a
                      href={omdbService.getIMDBUrl(comp.imdbID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-hanok-teal/50 hover:text-yellow-600 transition-colors"
                      title="View on IMDB"
                    >
                      <Icon icon="solar:square-arrow-right-up-bold-duotone" className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemoveComp(index)}
                className="hover:bg-hanok-teal/20 rounded-full p-1 transition-colors ml-1"
                aria-label={`Remove ${comp.title}`}
              >
                <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Field with Autocomplete */}
      {canAddMore && (
        <div className="relative" ref={dropdownRef}>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder={
                  compTitles.length === 0
                    ? 'e.g., Squid Game, Parasite, Black Mirror...'
                    : compTitles.length === 1
                    ? 'Add another comp (optional)'
                    : 'Add final comp (optional)'
                }
                className="flex-1 border-gray-200 focus:border-hanok-teal focus:ring-hanok-teal/20 pr-8"
                maxLength={100}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            <Button
              onClick={handleAddManual}
              disabled={!inputValue.trim()}
              variant="outline"
              className="border-gray-200 hover:bg-hanok-teal/5 hover:border-hanok-teal/30 disabled:opacity-50"
            >
              Add
            </Button>
          </div>

          {/* Suggestions Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {suggestions.map((result) => (
                <div
                  key={result.imdbID}
                  onClick={() => handleSelectSuggestion(result)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  {/* Poster Image - 1.5x bigger (60x84px) */}
                  <div className="w-[60px] h-[84px] flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {result.Poster && result.Poster !== 'N/A' ? (
                      <img
                        src={result.Poster}
                        alt={result.Title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${result.Poster && result.Poster !== 'N/A' ? 'hidden' : ''}`}>
                      {result.Type === 'series' ? (
                        <Icon icon="solar:tv-bold-duotone" className="h-6 w-6 text-gray-400" />
                      ) : (
                        <Icon icon="solar:clapperboard-bold-duotone" className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {/* Title Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {result.Type === 'series' ? (
                        <Icon icon="solar:tv-bold-duotone" className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      ) : (
                        <Icon icon="solar:clapperboard-bold-duotone" className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-gray-900 truncate">{result.Title}</span>
                    </div>
                    <span className="text-gray-500 text-sm">{result.Year}</span>
                  </div>
                  {/* IMDB Link */}
                  <a
                    href={omdbService.getIMDBUrl(result.imdbID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 hover:text-yellow-500 transition-colors flex-shrink-0"
                    title="View on IMDB"
                  >
                    <Icon icon="solar:square-arrow-right-up-bold-duotone" className="h-4 w-4" />
                  </a>
                </div>
              ))}
              <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                Click to select or press Enter for first result
              </div>
            </div>
          )}

          {/* No results message */}
          {showDropdown && suggestions.length === 0 && !isLoading && inputValue.trim().length >= 2 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="px-3 py-3 text-sm text-gray-500">
                No titles found. Press Enter or click "Add" to add manually.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Helper Text */}
      {compTitles.length === maxComps && (
        <p className="text-xs font-medium text-hanok-teal bg-hanok-teal/10 border border-hanok-teal/30 rounded-lg p-3">
          ✓ Maximum {maxComps} comps selected. Click "Find Matches" to search.
        </p>
      )}
    </div>
  );
}
