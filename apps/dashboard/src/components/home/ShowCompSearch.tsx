import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Film, Search, Loader2, Tv, ExternalLink } from 'lucide-react';
import { compsNavigatorService, type TitleMatch } from '@/services/compsNavigatorService';
import { omdbService, OMDBSearchResult } from '@/services/omdbService';
import { useAuth } from '@/hooks/useAuth';
import { HomeResultCard } from './HomeResultCard';
import { useToast } from '@/hooks/use-toast';

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
  const hasTriggeredInitialSearch = useRef(false);

  // OMDB autocomplete state
  const [suggestions, setSuggestions] = useState<OMDBSearchResult[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search effect for OMDB suggestions
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      const results = await omdbService.searchTitles(trimmed);
      setSuggestions(results.slice(0, 6)); // Max 6 suggestions
      setShowDropdown(results.length > 0);
      setIsLoadingSuggestions(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

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
    setQuery(result.Title);
    setShowDropdown(false);
    setSuggestions([]);
    // Trigger search immediately
    handleSearchWithQuery(result.Title);
  };

  const handleSearchWithQuery = async (searchQuery: string) => {
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

      setResults(response.results || []);

      if (response.results.length === 0) {
        toast({
          title: 'No matches found',
          description: 'Try a different show or check the spelling.',
        });
      }
    } catch (error) {
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
  };

  const handleSearch = () => {
    handleSearchWithQuery(query);
  };

  // Auto-trigger search when initialQuery is provided
  useEffect(() => {
    if (initialQuery && user?.email && !hasTriggeredInitialSearch.current) {
      hasTriggeredInitialSearch.current = true;
      handleSearchWithQuery(initialQuery);
    }
  }, [initialQuery, user?.email]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showDropdown && suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        handleSearch();
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-2 rounded-full mb-4">
          <Film className="h-5 w-5 text-cyan-500" />
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
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isLoadingSuggestions && !isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              )}
              <Button
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className="bg-hanok-teal hover:bg-hanok-teal/90"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Suggestions Dropdown */}
          {showDropdown && suggestions.length > 0 && !isLoading && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {suggestions.map((result) => (
                <div
                  key={result.imdbID}
                  onClick={() => handleSelectSuggestion(result)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {result.Type === 'series' ? (
                      <Tv className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Film className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    )}
                    <span className="font-medium text-gray-900 truncate">{result.Title}</span>
                    <span className="text-gray-500 text-sm flex-shrink-0">({result.Year})</span>
                  </div>
                  <a
                    href={omdbService.getIMDBUrl(result.imdbID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 hover:text-yellow-500 transition-colors flex-shrink-0 ml-2"
                    title="View on IMDB"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
              <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                Click to select or press Enter for first result
              </div>
            </div>
          )}
        </div>

        {/* Example suggestions - clicking triggers search immediately */}
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          <span className="text-sm text-gray-400">Try:</span>
          {['The Bear', 'Squid Game', 'Succession', 'Emily in Paris'].map((example) => (
            <button
              key={example}
              onClick={() => {
                setQuery(example);
                setShowDropdown(false);
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
          <Loader2 className="h-8 w-8 animate-spin text-hanok-teal mb-4" />
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
            {results.slice(0, 5).map((result) => (
              <HomeResultCard
                key={result.title_id}
                title={result}
                matchScore={result.match_score}
                explanation={result.explanation}
              />
            ))}
          </div>

          {results.length > 5 && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Showing top 5 of {results.length} matches.{' '}
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
            <Film className="h-12 w-12 mx-auto opacity-50" />
          </div>
          <p className="text-gray-600 mb-2">No matches found for "{query}"</p>
          <p className="text-sm text-gray-400">Try a different show name or check the spelling.</p>
        </div>
      )}
    </div>
  );
}
