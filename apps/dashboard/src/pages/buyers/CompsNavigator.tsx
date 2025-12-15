/**
 * Comps Navigator Page
 *
 * Main page for the Comps Navigator feature.
 * Allows buyers to search for Korean titles based on Hollywood/global comps.
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/hooks/use-toast';
import { compsNavigatorService, TitleMatch, CompSearch, CompTitle } from '@/services/compsNavigatorService';
import CompsNavigatorInput from '@/components/comps-navigator/CompsNavigatorInput';
import ResultsGrid from '@/components/comps-navigator/ResultsGrid';
import { SearchLoadingModal } from '@/components/comps-navigator/SearchLoadingModal';
import SavedSearchesSidebar from '@/components/comps-navigator/SavedSearchesSidebar';
import ExamplesSection from '@/components/comps-navigator/ExamplesSection';
import { Button } from '@/components/ui/button';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trackPageView, trackFeatureUsage, trackCompsSearch } from '@/utils/analytics';

type LoadingPhase = 'describing' | 'semantic' | 'reranking' | null;

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
  const { isAdmin } = useAdminAuth();
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
  // V2.1.0 - Relevancy filtering state
  const [noResultsMessage, setNoResultsMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  // V2.2.0 - Two-phase search with LLM descriptions
  const [compDescriptions, setCompDescriptions] = useState<Record<string, string> | null>(null);

  // Track page view on mount
  useEffect(() => {
    trackPageView('/buyers/comps-navigator', 'Comps Navigator');
    trackFeatureUsage('comps_navigator');
  }, []);

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
    setLoadingPhase('describing');
    setResults([]);
    setNoResultsMessage(null);
    setSuggestions(null);
    setCompDescriptions(null);
    setHasSearched(true);

    // Declare timer outside try block so it can be cleared in finally
    let phaseTimer: NodeJS.Timeout | null = null;

    try {
      // PHASE 1: Get LLM descriptions (~2-3s)
      // Show users what the AI understood about their comps
      const descResponse = await compsNavigatorService.getCompDescriptions(titles);
      setCompDescriptions(descResponse.descriptions);

      // PHASE 2: Search with provided descriptions
      setLoadingPhase('semantic');
      phaseTimer = setTimeout(() => setLoadingPhase('reranking'), 2000);

      const response = await compsNavigatorService.searchComps(
        titles,
        undefined,
        user.email,
        true,
        undefined,
        descResponse.descriptions // Pass descriptions to skip LLM call
      );

      setResults(response.results);
      setSearchInfo({
        time: response.processing_time_ms + descResponse.processing_time_ms,
        cost: response.cost_estimate
      });

      // Handle no results case with message and suggestions
      if (response.no_results_message) {
        setNoResultsMessage(response.no_results_message);
        setSuggestions(response.suggestions || null);
      }

      // Track comps search
      trackCompsSearch(titles, response.results.length, response.processing_time_ms);

      if (response.results.length > 0) {
        toast({
          title: "Matches Found",
          description: `Found ${response.results.length} titles matching your comp combination`
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to find matches. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Always clear timer to prevent memory leaks
      if (phaseTimer) {
        clearTimeout(phaseTimer);
      }
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
    // Delegate to handleSearchWithTitles to avoid code duplication
    await handleSearchWithTitles(compTitlesToStrings(compTitles));
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
    setNoResultsMessage(null);
    setSuggestions(null);
    setCompDescriptions(null);
    setHasSearched(false);
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
              variant="ghost"
              size="sm"
              className="md:border md:border-gray-300 md:hover:bg-gray-100 hover:bg-gray-100/50 rounded-xl p-2.5 md:px-3"
            >
              <Icon icon="solar:clock-circle-bold-duotone" className="h-5 w-5 md:h-4 md:w-4 text-gray-600 md:mr-2" />
              <span className="hidden md:inline">History</span>
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
          isAdmin={isAdmin}
        />

        {/* AI Understanding - Show what AI understood about the comps */}
        {!isLoading && compDescriptions && Object.keys(compDescriptions).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Icon icon="solar:magic-stick-3-bold-duotone" className="h-5 w-5" />
              AI Understanding
            </p>
            <div className="space-y-2">
              {Object.entries(compDescriptions).map(([title, description]) => (
                <div key={title} className="text-sm text-blue-700">
                  <span className="font-semibold">{title}:</span>{' '}
                  <span className="text-blue-600">{description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <ResultsGrid results={results} />
        )}

        {/* No Results Empty State */}
        {!isLoading && hasSearched && results.length === 0 && noResultsMessage && (
          <div className="text-center py-12 px-4">
            <Icon icon="solar:compass-bold-duotone" className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">{noResultsMessage}</p>
            {suggestions && suggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Try these suggestions:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              onClick={() => setShowExamples(true)}
              variant="outline"
              className="mt-6 border-gray-300 hover:bg-gray-100"
            >
              <Icon icon="solar:lightbulb-bold-duotone" className="h-4 w-4 mr-2" />
              View Example Combinations
            </Button>
          </div>
        )}
      </div>

      {/* Search Loading Modal - displays progress as popup for visibility */}
      <SearchLoadingModal isOpen={isLoading} compDescriptions={compDescriptions} />

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
