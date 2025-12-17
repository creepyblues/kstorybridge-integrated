import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { compsNavigatorService, type TitleMatch } from '@/services/compsNavigatorService';
import { omdbService, OMDBSearchResult } from '@/services/omdbService';
import { useAuth } from '@/hooks/useAuth';
import { HomeResultCard } from './HomeResultCard';
import { useToast } from '@/hooks/use-toast';
import { useOMDBAutocomplete } from '@/hooks/useOMDBAutocomplete';
import { getRandomShowSuggestions } from '@/data/examplesData';
const MAX_PREVIEW_RESULTS = 5;

interface ShowCompSearchProps {
  initialQuery?: string;
}

export function ShowCompSearch({ initialQuery = '' }: ShowCompSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TitleMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Use centralized suggestion data from examplesData.ts
  const exampleShows = useMemo(() => getRandomShowSuggestions(4), []);
  const hasTriggeredInitialSearch = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use shared OMDB autocomplete hook
  const {
    suggestions,
    isLoading: isLoadingSuggestions,
    showDropdown,
    setShowDropdown,
    dropdownRef,
    focusedIndex,
    handleKeyDown: handleAutocompleteKeyDown,
    clearSuggestions,
  } = useOMDBAutocomplete(query, { maxResults: 6 });

  const handleSelectSuggestion = useCallback((result: OMDBSearchResult) => {
    setQuery(result.Title);
    clearSuggestions();
    // Trigger search immediately
    handleSearchWithQuery(result.Title);
  }, [clearSuggestions]);

  const handleSearchWithQuery = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Please enter a show name',
        description: 'Type a show you like to find similar Korean IP.',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to search.',
        variant: 'destructive',
      });
      return;
    }

    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setShowDropdown(false);
    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await compsNavigatorService.searchComps(
        [searchQuery.trim()],
        undefined,
        user.email,
        false // Don't save to history for quick homepage searches
      );

      // Check if this request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setResults(response.results || []);

      if (response.results.length === 0) {
        toast({
          title: 'No matches found',
          description: 'Try a different show or check the spelling.',
        });
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Comp search error:', error);
      toast({
        title: 'Search failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, toast, setShowDropdown]);

  const handleSearch = useCallback(() => {
    handleSearchWithQuery(query);
  }, [query, handleSearchWithQuery]);

  // Auto-trigger search when initialQuery is provided
  useEffect(() => {
    if (initialQuery && user?.email && !hasTriggeredInitialSearch.current) {
      hasTriggeredInitialSearch.current = true;
      handleSearchWithQuery(initialQuery);
    }
  }, [initialQuery, user?.email, handleSearchWithQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    handleAutocompleteKeyDown(e, handleSelectSuggestion);
    // If no dropdown or Enter not handled by hook, submit search
    if (e.key === 'Enter' && !showDropdown) {
      handleSearch();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-2 rounded-full mb-4">
          <Icon icon="solar:clapperboard-bold-duotone" className="h-5 w-5 text-cyan-500" aria-hidden="true" />
          <span className="text-cyan-600 font-medium">Find Similar IP</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
          What show do you love?
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Enter a show you enjoy, and we'll find Korean IP with similar tone, themes, and audience appeal.
        </p>
      </div>

      {/* Search Input with Autocomplete */}
      <div className="max-w-2xl mx-auto">
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              placeholder="Type a show you love (e.g., The Bear, Squid Game, This Is Us)"
              className="w-full text-lg py-6 pr-24 rounded-xl border-gray-300 focus:border-hanok-teal focus:ring-hanok-teal"
              disabled={isLoading}
              aria-label="Search for a show to find similar Korean IP"
              aria-autocomplete="list"
              aria-expanded={showDropdown}
              aria-controls="show-comp-suggestions"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isLoadingSuggestions && !isLoading && (
                <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 animate-spin text-gray-400" aria-hidden="true" />
              )}
              <Button
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className="bg-hanok-teal hover:bg-hanok-teal/90"
                aria-label="Search for similar Korean IP"
              >
                {isLoading ? (
                  <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Icon icon="solar:magnifer-bold-duotone" className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          {/* Suggestions Dropdown with Poster Images */}
          {showDropdown && suggestions.length > 0 && !isLoading && (
            <div
              id="show-comp-suggestions"
              role="listbox"
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto"
            >
              {suggestions.map((result, index) => (
                <div
                  key={result.imdbID}
                  role="option"
                  aria-selected={focusedIndex === index}
                  onClick={() => handleSelectSuggestion(result)}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors group ${
                    focusedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Poster Image */}
                  <div className="w-10 h-14 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {result.Poster && result.Poster !== 'N/A' ? (
                      <img
                        src={result.Poster}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.classList.remove('hidden');
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${result.Poster && result.Poster !== 'N/A' ? 'hidden' : ''}`}>
                      {result.Type === 'series' ? (
                        <Icon icon="solar:tv-bold-duotone" className="h-5 w-5 text-gray-300" aria-hidden="true" />
                      ) : (
                        <Icon icon="solar:clapperboard-bold-duotone" className="h-5 w-5 text-gray-300" aria-hidden="true" />
                      )}
                    </div>
                  </div>

                  {/* Title Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {result.Type === 'series' ? (
                        <Icon icon="solar:tv-bold-duotone" className="h-4 w-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <Icon icon="solar:clapperboard-bold-duotone" className="h-4 w-4 text-purple-500 flex-shrink-0" aria-hidden="true" />
                      )}
                      <span className="font-medium text-gray-900 truncate">{result.Title}</span>
                    </div>
                    <span className="text-gray-500 text-sm">({result.Year})</span>
                  </div>

                  {/* IMDB Link - Fixed: Changed from yellow to blue per design system */}
                  <a
                    href={omdbService.getIMDBUrl(result.imdbID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                    title="View on IMDB"
                    aria-label={`View ${result.Title} on IMDB`}
                  >
                    <Icon icon="solar:square-arrow-right-up-bold-duotone" className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              ))}
              <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                Use ↑↓ arrows to navigate, Enter to select
              </div>
            </div>
          )}
        </div>

        {/* Example suggestions - clicking triggers search immediately */}
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          <span className="text-sm text-gray-400">Try:</span>
          {exampleShows.map((example) => (
            <button
              key={example}
              onClick={() => {
                setQuery(example);
                clearSuggestions();
                // Trigger search immediately with the example
                handleSearchWithQuery(example);
              }}
              disabled={isLoading}
              className="text-sm text-hanok-teal hover:underline disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-hanok-teal mb-4" aria-hidden="true" />
          <p className="text-gray-600 text-center">
            Matching Korean IP with similar tone, themes, and audience...
          </p>
          <p className="text-sm text-gray-400 mt-2">This usually takes 5-10 seconds</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600">
              Found <span className="font-semibold text-black">{results.length}</span> Korean titles similar to{' '}
              <span className="font-semibold text-hanok-teal">"{query}"</span>
            </p>
          </div>

          <div className="space-y-4">
            {results.slice(0, MAX_PREVIEW_RESULTS).map((result) => (
              <HomeResultCard
                key={result.title_id}
                title={result}
                matchScore={result.match_score}
                explanation={result.explanation}
              />
            ))}
          </div>

          {results.length > MAX_PREVIEW_RESULTS && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Showing top {MAX_PREVIEW_RESULTS} of {results.length} matches.{' '}
                <a href="/buyers/comps-navigator" className="text-hanok-teal hover:underline">
                  See all in Comps Navigator
                </a>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State (after search) */}
      {!isLoading && hasSearched && results.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Icon icon="solar:clapperboard-bold-duotone" className="h-12 w-12 mx-auto opacity-50" aria-hidden="true" />
          </div>
          <p className="text-gray-600 mb-2">No matches found for "{query}"</p>
          <p className="text-sm text-gray-400">Try a different show name or check the spelling.</p>
        </div>
      )}
    </div>
  );
}
