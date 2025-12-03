/**
 * Comps Navigator Page
 *
 * Main page for the Comps Navigator feature.
 * Allows buyers to search for Korean titles based on Hollywood/global comps.
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { compsNavigatorService, TitleMatch, CompSearch } from '@/services/compsNavigatorService';
import { CompTitle } from '@/components/comps-navigator/CompSelector';
import CompsNavigatorInput from '@/components/comps-navigator/CompsNavigatorInput';
import ResultsGrid from '@/components/comps-navigator/ResultsGrid';
import SavedSearchesSidebar from '@/components/comps-navigator/SavedSearchesSidebar';
import ExamplesSection from '@/components/comps-navigator/ExamplesSection';
import { Button } from '@/components/ui/button';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const hasTriggeredInitialSearch = useRef(false);

  const [compTitles, setCompTitles] = useState<CompTitle[]>([]);
  const [results, setResults] = useState<TitleMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [searchInfo, setSearchInfo] = useState<{ time: number; cost: number } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  // Handle URL parameter for initial search
  useEffect(() => {
    const showParam = searchParams.get('show');
    if (showParam && !hasTriggeredInitialSearch.current && user?.email) {
      hasTriggeredInitialSearch.current = true;
      // Set the comp title and trigger search
      const initialCompTitle: CompTitle = {
        title: showParam,
        imdbID: '',
        year: '',
        type: 'movie' as const
      };
      setCompTitles([initialCompTitle]);
      // Clear the URL parameter
      setSearchParams({}, { replace: true });
      // Trigger search after state is set
      setTimeout(() => {
        handleSearchWithTitles([showParam]);
      }, 100);
    }
  }, [searchParams, user?.email]);

  const handleSearchWithTitles = async (titles: string[]) => {
    if (titles.length === 0) {
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
      const phaseTimer = setTimeout(() => setLoadingPhase('reranking'), 1500);

      const response = await compsNavigatorService.searchComps(
        titles,
        undefined,
        user.email,
        true
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
        undefined,
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
    setResults([]);
    setSearchInfo(null);
  };

  const handleTryExample = (comps: string[]) => {
    // Convert string[] from examples to CompTitle[]
    setCompTitles(stringsToCompTitles(comps));
    setShowExamples(false);
  };

  return (
    <BuyerLayout>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8 overflow-x-hidden">
        {/* History Button - Top Right */}
        {user?.email && (
          <div className="flex justify-end">
            <Button
              onClick={() => setShowHistory(true)}
              variant="outline"
              size="sm"
              className="border-gray-300 hover:bg-gray-100"
            >
              <History className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </div>
        )}

        {/* Search Form */}
        <CompsNavigatorInput
          compTitles={compTitles}
          onChange={setCompTitles}
          onSearch={handleSearch}
          onClear={handleClear}
          onNeedHelp={() => setShowExamples(true)}
          isLoading={isLoading}
          loadingPhase={loadingPhase}
          searchInfo={searchInfo}
          hasResults={results.length > 0}
        />

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

      {/* Examples Modal */}
      <Dialog open={showExamples} onOpenChange={setShowExamples}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 border-b border-gray-100">
            <DialogTitle className="text-lg sm:text-xl font-bold text-hanok-teal">
              Explore Example Combinations
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              Learn how to combine comps effectively by trying these curated examples
            </p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <ExamplesSection
              onTryExample={(comps) => {
                handleTryExample(comps);
              }}
              isModal={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </BuyerLayout>
  );
}
