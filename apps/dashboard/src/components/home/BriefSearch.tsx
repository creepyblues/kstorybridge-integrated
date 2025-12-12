import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { titlesService, type Title } from '@/services/titlesService';
import { HomeResultCard } from './HomeResultCard';
import { useToast } from '@/hooks/use-toast';

const exampleBriefs = [
  'Female-driven thriller with contained locations',
  'Romantic comedy for streaming, completed series',
  'Dark fantasy with strong world-building',
  'Family drama with multi-generational story',
];

interface BriefSearchProps {
  initialQuery?: string;
}

export function BriefSearch({ initialQuery = '' }: BriefSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Title[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const hasTriggeredInitialSearch = useRef(false);

  const handleSearchWithQuery = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Please describe what you\'re looking for',
        description: 'Enter a brief description of the type of content you need.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Use vector search for semantic matching
      const searchResults = await titlesService.searchTitlesVector(searchQuery.trim(), 10);
      setResults(searchResults);

      if (searchResults.length === 0) {
        toast({
          title: 'No matches found',
          description: 'Try adjusting your description or using different keywords.',
        });
      }
    } catch (error) {
      console.error('Brief search error:', error);
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
    if (initialQuery && !hasTriggeredInitialSearch.current) {
      hasTriggeredInitialSearch.current = true;
      handleSearchWithQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleExampleClick = (example: string) => {
    setQuery(example);
    handleSearchWithQuery(example);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-2 rounded-full mb-4">
          <Icon icon="solar:document-text-bold-duotone" className="h-5 w-5 text-purple-500" />
          <span className="text-purple-600 font-medium">Search by Brief</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
          Describe what you're looking for
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Tell us about the type of content you need – genre, tone, themes, format – and we'll find matching Korean IP.
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-2xl mx-auto">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe the content you're looking for...&#10;&#10;e.g., Female-driven thriller with contained locations, suitable for limited series adaptation"
          className="w-full min-h-[120px] text-base py-4 rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500 resize-none"
          disabled={isLoading}
        />

        <div className="flex justify-end mt-3">
          <Button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            {isLoading ? (
              <>
                <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 animate-spin mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Icon icon="solar:magnifer-bold-duotone" className="h-4 w-4 mr-2" />
                Find Matches
              </>
            )}
          </Button>
        </div>

        {/* Example briefs - clicking triggers search immediately */}
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-3">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleBriefs.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-purple-500 mb-4" />
          <p className="text-gray-600 text-center">
            Searching for Korean IP matching your brief...
          </p>
          <p className="text-sm text-gray-400 mt-2">Using AI-powered semantic search</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600">
              Found <span className="font-semibold text-black">{results.length}</span> titles matching your brief
            </p>
          </div>

          <div className="space-y-4">
            {results.slice(0, 5).map((result) => (
              <HomeResultCard
                key={result.title_id}
                title={result}
              />
            ))}
          </div>

          {results.length > 5 && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Showing top 5 of {results.length} matches.{' '}
                <a href="/buyers/titles" className="text-purple-600 hover:underline">
                  Browse all titles
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
            <Icon icon="solar:document-text-bold-duotone" className="h-12 w-12 mx-auto opacity-50" />
          </div>
          <p className="text-gray-600 mb-2">No matches found for your brief</p>
          <p className="text-sm text-gray-400">Try adjusting your description or using different keywords.</p>
        </div>
      )}
    </div>
  );
}
