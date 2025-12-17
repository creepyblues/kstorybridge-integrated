/**
 * CompsNavigatorInput Component
 *
 * Multi-input component for selecting up to 3 comparable titles.
 * Clean search-engine style design.
 * Features OMDB autocomplete for each input.
 *
 * IMPORTANT: Uses examplesData.ts as single source of truth for examples.
 * Do NOT hardcode examples in this component.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { omdbService, OMDBSearchResult } from '@/services/omdbService';
import { CompTitle } from '@/services/compsNavigatorService';
import { getRandomCompSuggestions } from '@/data/examplesData';

interface CompsNavigatorInputProps {
  compTitles: CompTitle[];
  onChange: (titles: CompTitle[]) => void;
  onSearch: () => void;
  onClear: () => void;
  onNeedHelp: () => void;
  isLoading: boolean;
  loadingPhase: 'describing' | 'semantic' | 'reranking' | null;
  searchInfo: { time: number; cost: number } | null;
  hasResults: boolean;
  isAdmin?: boolean;
}

export default function CompsNavigatorInput({
  compTitles,
  onChange,
  onSearch,
  onClear,
  onNeedHelp: _onNeedHelp, // Reserved for future "Need Help" button
  isLoading,
  loadingPhase,
  searchInfo,
  hasResults,
  isAdmin,
}: CompsNavigatorInputProps) {
  // Track how many input rows are visible (1-3)
  const [activeInputCount, setActiveInputCount] = useState(1);

  // Input values for each row
  const [inputValues, setInputValues] = useState<string[]>(['', '', '']);

  // Suggestions for each input
  const [suggestions, setSuggestions] = useState<OMDBSearchResult[][]>([[], [], []]);

  // Loading state for each input's suggestions
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean[]>([false, false, false]);

  // Dropdown visibility for each input
  const [showDropdown, setShowDropdown] = useState<boolean[]>([false, false, false]);

  // Refs for click outside detection
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  // Use centralized suggestion data from examplesData.ts
  const exampleSuggestions = useMemo(() => getRandomCompSuggestions(3), []);

  // Handle clicking an example suggestion - parse and execute search directly
  const handleExampleClick = (example: string) => {
    // Parse the example (may contain " + " to separate titles)
    const titles = example.split(' + ').map(title => title.trim());

    // Create CompTitle objects for each title
    const newCompTitles: CompTitle[] = titles.map(title => ({
      title,
      imdbID: '',
      year: '',
      type: 'movie' as const,
    }));

    // Set the comp titles and trigger search
    onChange(newCompTitles);
    setActiveInputCount(newCompTitles.length);

    // Use setTimeout to ensure state is updated before search
    setTimeout(() => {
      onSearch();
    }, 0);
  };

  // Sync activeInputCount with compTitles length
  useEffect(() => {
    if (compTitles.length > activeInputCount) {
      setActiveInputCount(compTitles.length);
    }
  }, [compTitles.length]);

  // Debounced search effect for each input
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    inputValues.forEach((value, index) => {
      const trimmed = value.trim();

      if (trimmed.length < 2) {
        setSuggestions((prev) => {
          const newSuggestions = [...prev];
          newSuggestions[index] = [];
          return newSuggestions;
        });
        setShowDropdown((prev) => {
          const newShow = [...prev];
          newShow[index] = false;
          return newShow;
        });
        return;
      }

      const timer = setTimeout(async () => {
        setIsLoadingSuggestions((prev) => {
          const newLoading = [...prev];
          newLoading[index] = true;
          return newLoading;
        });

        const results = await omdbService.searchTitles(trimmed);
        // Deduplicate by imdbID to avoid React key warnings
        const uniqueResults = results.filter(
          (result, idx, self) => self.findIndex(r => r.imdbID === result.imdbID) === idx
        );

        setSuggestions((prev) => {
          const newSuggestions = [...prev];
          newSuggestions[index] = uniqueResults.slice(0, 6);
          return newSuggestions;
        });

        setShowDropdown((prev) => {
          const newShow = [...prev];
          newShow[index] = results.length > 0;
          return newShow;
        });

        setIsLoadingSuggestions((prev) => {
          const newLoading = [...prev];
          newLoading[index] = false;
          return newLoading;
        });
      }, 300);

      timers.push(timer);
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [inputValues]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      dropdownRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target as Node)) {
          setShowDropdown((prev) => {
            const newShow = [...prev];
            newShow[index] = false;
            return newShow;
          });
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown([false, false, false]);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelectSuggestion = (index: number, result: OMDBSearchResult) => {
    // Check for duplicates by IMDB ID
    if (compTitles.some((c) => c.imdbID === result.imdbID)) {
      setInputValues((prev) => {
        const newValues = [...prev];
        newValues[index] = '';
        return newValues;
      });
      setShowDropdown((prev) => {
        const newShow = [...prev];
        newShow[index] = false;
        return newShow;
      });
      return;
    }

    const newComp: CompTitle = {
      title: result.Title,
      imdbID: result.imdbID,
      year: result.Year,
      type: result.Type,
      poster: result.Poster !== 'N/A' ? result.Poster : undefined,
    };

    // Add or replace the comp at this index
    const newCompTitles = [...compTitles];
    newCompTitles[index] = newComp;

    // Filter out undefined entries and compact the array
    onChange(newCompTitles.filter(Boolean));

    // Clear the input
    setInputValues((prev) => {
      const newValues = [...prev];
      newValues[index] = '';
      return newValues;
    });

    setSuggestions((prev) => {
      const newSuggestions = [...prev];
      newSuggestions[index] = [];
      return newSuggestions;
    });

    setShowDropdown((prev) => {
      const newShow = [...prev];
      newShow[index] = false;
      return newShow;
    });
  };

  const handleRemoveComp = (index: number) => {
    const newCompTitles = compTitles.filter((_, i) => i !== index);
    onChange(newCompTitles);

    // If we have fewer comps than active inputs, reduce active inputs
    if (newCompTitles.length < activeInputCount && activeInputCount > 1) {
      setActiveInputCount(Math.max(newCompTitles.length, 1));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showDropdown[index] && suggestions[index].length > 0) {
        handleSelectSuggestion(index, suggestions[index][0]);
      }
    }
  };

  const handleAddInput = () => {
    if (activeInputCount < 3) {
      setActiveInputCount((prev) => prev + 1);
    }
  };

  const canAddMore = activeInputCount < 3;
  const hasAnyInput = compTitles.length > 0 || inputValues.some((v) => v.trim());
  const showClear = hasAnyInput || hasResults;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">
          What show do you love?
        </h2>
      </div>

      {/* Input Rows */}
      <div className="space-y-3">
        {Array.from({ length: activeInputCount }).map((_, index) => {
          const selectedComp = compTitles[index];
          const inputValue = inputValues[index];
          const inputSuggestions = suggestions[index];
          const isLoadingInput = isLoadingSuggestions[index];
          const isDropdownVisible = showDropdown[index];

          return (
            <div key={index} className="relative" ref={(el) => (dropdownRefs.current[index] = el)}>
              {/* Selected Comp Chip */}
              {selectedComp ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center justify-between p-3 bg-gradient-to-r from-hanok-teal/10 to-hanok-teal/5 border border-hanok-teal/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      {/* Poster thumbnail */}
                      <div className="w-[45px] h-[63px] flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        {selectedComp.poster ? (
                          <img
                            src={selectedComp.poster}
                            alt={selectedComp.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {selectedComp.type === 'series' ? (
                              <Icon icon="solar:tv-bold-duotone" className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Icon icon="solar:clapperboard-bold-duotone" className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {selectedComp.type === 'series' ? (
                            <Icon icon="solar:tv-bold-duotone" className="h-4 w-4 text-hanok-teal/70" />
                          ) : (
                            <Icon icon="solar:clapperboard-bold-duotone" className="h-4 w-4 text-hanok-teal/70" />
                          )}
                          <span className="font-medium text-hanok-teal">{selectedComp.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {selectedComp.year && (
                            <span className="text-hanok-teal/60 text-sm">{selectedComp.year}</span>
                          )}
                          {selectedComp.imdbID && (
                            <a
                              href={omdbService.getIMDBUrl(selectedComp.imdbID)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-hanok-teal/50 hover:text-yellow-600 transition-colors"
                              title="View on IMDB"
                            >
                              <Icon icon="solar:square-arrow-right-up-bold-duotone" className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveComp(index)}
                      className="p-1 hover:bg-hanok-teal/20 rounded-full transition-colors"
                      aria-label={`Remove ${selectedComp.title}`}
                    >
                      <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4 text-hanok-teal" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Input Field */
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={inputValue}
                      onChange={(e) => {
                        setInputValues((prev) => {
                          const newValues = [...prev];
                          newValues[index] = e.target.value;
                          return newValues;
                        });
                      }}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onFocus={() => {
                        if (inputSuggestions.length > 0) {
                          setShowDropdown((prev) => {
                            const newShow = [...prev];
                            newShow[index] = true;
                            return newShow;
                          });
                        }
                      }}
                      placeholder={
                        index === 0
                          ? 'Type a show you love (e.g., Twilight, Bridgerton)'
                          : `Add ${index === 1 ? 'second' : 'third'} show (optional)`
                      }
                      className="w-full text-sm sm:text-base py-5 sm:py-6 pr-12 rounded-xl border-gray-300 focus:border-hanok-teal focus:ring-hanok-teal"
                      disabled={isLoading}
                    />
                    {isLoadingInput && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Icon icon="solar:refresh-circle-bold-duotone" className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Suggestions Dropdown */}
              {isDropdownVisible && inputSuggestions.length > 0 && !isLoading && !selectedComp && (
                <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto" style={{ width: 'calc(100% - 60px)', maxWidth: 'calc(100% - 60px)' }}>
                  {inputSuggestions.map((result) => (
                    <div
                      key={result.imdbID}
                      onClick={() => handleSelectSuggestion(index, result)}
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
                  <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                    Click to select or press Enter for first result
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Another Button */}
      {canAddMore && (
        <button
          onClick={handleAddInput}
          disabled={isLoading}
          className="flex items-center gap-2 text-sm text-hanok-teal hover:text-hanok-teal/80 transition-colors disabled:opacity-50"
        >
          <Icon icon="solar:add-circle-bold-duotone" className="h-4 w-4" />
          Add another title
        </button>
      )}

      {/* Find Matches and Clear Buttons */}
      <div className="flex justify-end gap-2 mt-3">
        {showClear && (
          <Button
            onClick={() => {
              onClear();
              setInputValues(['', '', '']);
              setActiveInputCount(1);
            }}
            variant="outline"
            disabled={isLoading}
            className="border-gray-300 hover:bg-gray-100"
          >
            <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
        <Button
          onClick={onSearch}
          disabled={isLoading || compTitles.length === 0}
          className="bg-gradient-to-r from-hanok-teal to-cyan-600 hover:from-hanok-teal/90 hover:to-cyan-700"
        >
          {isLoading ? (
            <>
              <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 animate-spin mr-2" />
              {loadingPhase === 'semantic' ? 'Searching...' : 'Ranking...'}
            </>
          ) : (
            <>
              <Icon icon="solar:magnifer-bold-duotone" className="h-4 w-4 mr-2" />
              Find Matches
            </>
          )}
        </Button>
      </div>

      {/* Example suggestions */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-4">Try asking:</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {exampleSuggestions.map((example) => (
            <button
              key={example}
              onClick={() => handleExampleClick(example)}
              disabled={isLoading}
              className="px-2.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Search Info - Admin Only */}
      {searchInfo && !isLoading && isAdmin && (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-gray-400">
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium uppercase">
            Admin Only
          </span>
          <span>{(searchInfo.time / 1000).toFixed(1)}s</span>
          <span>•</span>
          <span>${searchInfo.cost.toFixed(3)}</span>
        </div>
      )}
    </div>
  );
}
