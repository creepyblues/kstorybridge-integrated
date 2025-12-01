/**
 * Comps Navigator Page
 *
 * Main page for the Comps Navigator feature.
 * Allows buyers to search for Korean titles based on Hollywood/global comps.
 */

import { useState } from 'react';
import { Compass, Search, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { compsNavigatorService, TitleMatch, CompSearch } from '@/services/compsNavigatorService';
import CompSelector, { CompTitle } from '@/components/comps-navigator/CompSelector';
import RefinementInput from '@/components/comps-navigator/RefinementInput';
import ResultsGrid from '@/components/comps-navigator/ResultsGrid';
import SavedSearchesSidebar from '@/components/comps-navigator/SavedSearchesSidebar';
import ExamplesSection from '@/components/comps-navigator/ExamplesSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type LoadingPhase = 'semantic' | 'reranking' | null;

/**
 * Helper to convert string[] to CompTitle[] (for loading from history/examples)
 * Creates CompTitle objects without IMDB metadata
 */
const stringsToCompTitles = (titles: string[]): CompTitle[] =>
  titles.map(title => ({
    title,
    imdbID: '',
    year: '',
    type: 'movie' as const
  }));

/**
 * Helper to extract title strings from CompTitle[] (for API calls)
 */
const compTitlesToStrings = (compTitles: CompTitle[]): string[] =>
  compTitles.map(c => c.title);

export default function CompsNavigator() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [compTitles, setCompTitles] = useState<CompTitle[]>([]);
  const [refinementText, setRefinementText] = useState('');
  const [results, setResults] = useState<TitleMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [searchInfo, setSearchInfo] = useState<{ time: number; cost: number } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleSearch = async () => {
    if (compTitles.length === 0) {
      toast({
        title: "No Comps Selected",
        description: "Please add at least one comparable title to search",
        variant: "destructive"
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use Comps Navigator",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setLoadingPhase('semantic');
    setResults([]);

    try {
      // Transition to reranking phase after semantic search completes
      const phaseTimer = setTimeout(() => setLoadingPhase('reranking'), 1500);

      // Extract title strings for API call
      const titleStrings = compTitlesToStrings(compTitles);

      const response = await compsNavigatorService.searchComps(
        titleStrings,
        refinementText || undefined,
        user.email,
        true // Save search
      );

      clearTimeout(phaseTimer);

      setResults(response.results);
      setSearchInfo({
        time: response.processing_time_ms,
        cost: response.cost_estimate
      });

      toast({
        title: "Matches Found",
        description: `Found ${response.results.length} titles matching your comp combination`
      });
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to find matches. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setLoadingPhase(null);
    }
  };

  const handleLoadSearch = (search: CompSearch) => {
    // Convert string[] from database to CompTitle[]
    setCompTitles(stringsToCompTitles(search.comp_titles));
    setRefinementText(search.refinement_text || '');

    if (search.search_results && search.search_results.length > 0) {
      setResults(search.search_results);
      toast({
        title: "Search Loaded",
        description: `Loaded "${search.search_name || search.comp_titles.join(' + ')}"`
      });
    }
  };

  const handleClear = () => {
    setCompTitles([]);
    setRefinementText('');
    setResults([]);
    setSearchInfo(null);
  };

  const handleTryExample = (comps: string[], refinement?: string) => {
    // Convert string[] from examples to CompTitle[]
    setCompTitles(stringsToCompTitles(comps));
    if (refinement) {
      setRefinementText(refinement);
    }
  };

  return (
    <BuyerLayout>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hanok-teal to-hanok-teal/80 p-3 rounded-2xl shadow-lg">
                <Compass className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-hanok-teal">Comps Navigator</h1>
                <p className="text-base sm:text-lg text-gray-600 mt-1">AI-Powered Korean Title Discovery</p>
              </div>
            </div>
            {user?.email && (
              <Button
                onClick={() => setShowHistory(true)}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-100 flex-shrink-0"
              >
                <History className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">History</span>
              </Button>
            )}
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Find Korean titles similar to your favorite shows and films. Select up to 3 comps to discover the perfect match using advanced semantic search.
          </p>
        </div>

        {/* Search Form */}
        <Card className="w-full bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg rounded-xl sm:rounded-2xl">
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">
            <CompSelector
              compTitles={compTitles}
              onChange={setCompTitles}
              maxComps={3}
            />

            <RefinementInput
              value={refinementText}
              onChange={setRefinementText}
              maxLength={500}
            />

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3">
              <Button
                onClick={handleSearch}
                disabled={isLoading || compTitles.length === 0}
                className="flex-1 flex items-center justify-center gap-2 h-11 sm:h-10"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-xs sm:text-sm">
                      {loadingPhase === 'semantic' && 'Finding matches...'}
                      {loadingPhase === 'reranking' && 'Re-ranking...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span className="text-sm sm:text-base">Find Matches</span>
                  </>
                )}
              </Button>

              {(compTitles.length > 0 || refinementText || results.length > 0) && (
                <Button
                  onClick={handleClear}
                  disabled={isLoading}
                  variant="outline"
                  className="border-gray-200 hover:bg-hanok-teal/5 hover:border-hanok-teal/30 h-11 sm:h-10 px-3 sm:px-4"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Search Info */}
            {searchInfo && !isLoading && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 pt-3 border-t border-gray-200">
                <span className="font-medium">
                  {(searchInfo.time / 1000).toFixed(1)}s
                </span>
                <span className="text-gray-300">•</span>
                <span className="font-medium">
                  ${searchInfo.cost.toFixed(3)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Example Searches - Only show when no results */}
        {results.length === 0 && !isLoading && (
          <ExamplesSection onTryExample={handleTryExample} />
        )}

        {/* Results */}
        {(results.length > 0 || isLoading) && (
          <ResultsGrid results={results} isLoading={isLoading} />
        )}
      </div>

      {/* History Dialog */}
      {user?.email && (
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-md max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Search History</DialogTitle>
            </DialogHeader>
            <SavedSearchesSidebar
              userEmail={user.email}
              onLoadSearch={(search) => {
                handleLoadSearch(search);
                setShowHistory(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </BuyerLayout>
  );
}
