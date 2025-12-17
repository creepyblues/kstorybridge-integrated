/**
 * TrialCompsSection
 *
 * Comps Navigator for trial users (no auth required).
 * Uses trial count limit instead of auth, does not save searches.
 */

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTrial } from '@/contexts/TrialContext';
import { compsNavigatorService, TitleMatch, CompTitle } from '@/services/compsNavigatorService';
import CompsNavigatorInput from '@/components/comps-navigator/CompsNavigatorInput';
import ExamplesSection from '@/components/comps-navigator/ExamplesSection';
import { SearchLoadingModal } from '@/components/comps-navigator/SearchLoadingModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrialResultsGrid } from './TrialResultsGrid';

type LoadingPhase = 'semantic' | 'reranking' | null;

const stringsToCompTitles = (titles: string[]): CompTitle[] =>
  titles.map(title => ({
    title,
    imdbID: '',
    year: '',
    type: 'movie' as const
  }));

const compTitlesToStrings = (compTitles: CompTitle[]): string[] =>
  compTitles.map(c => c.title);

export function TrialCompsSection() {
  const { toast } = useToast();
  const { hasTrialRemaining, incrementUsage, setShowLimitModal } = useTrial();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasTriggeredInitialSearch = useRef(false);

  const [compTitles, setCompTitles] = useState<CompTitle[]>([]);
  const [results, setResults] = useState<TitleMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [searchInfo, setSearchInfo] = useState<{ time: number; cost: number } | null>(null);
  const [showExamples, setShowExamples] = useState(false);

  // Handle URL parameter for initial search
  useEffect(() => {
    const showParam = searchParams.get('show');
    if (showParam && !hasTriggeredInitialSearch.current) {
      hasTriggeredInitialSearch.current = true;
      const initialCompTitle: CompTitle = {
        title: showParam,
        imdbID: '',
        year: '',
        type: 'movie' as const
      };
      setCompTitles([initialCompTitle]);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSearch = async () => {
    if (compTitles.length === 0) {
      toast({
        title: "No Comps Selected",
        description: "Please add at least one comparable title to search",
        variant: "destructive"
      });
      return;
    }

    // Check trial limit
    if (!hasTrialRemaining) {
      setShowLimitModal(true);
      return;
    }

    setIsLoading(true);
    setLoadingPhase('semantic');
    setResults([]);

    try {
      const phaseTimer = setTimeout(() => setLoadingPhase('reranking'), 1500);

      const titleStrings = compTitlesToStrings(compTitles);

      // Call service with saveSearch: false for trial mode
      const response = await compsNavigatorService.searchComps(
        titleStrings,
        undefined,
        undefined, // No user email in trial mode
        false // Don't save search
      );

      clearTimeout(phaseTimer);

      setResults(response.results);
      setSearchInfo({
        time: response.processing_time_ms,
        cost: response.cost_estimate
      });

      // Increment trial usage only on success
      incrementUsage();

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
      // Don't increment usage on error
    } finally {
      setIsLoading(false);
      setLoadingPhase(null);
    }
  };

  const handleClear = () => {
    setCompTitles([]);
    setResults([]);
    setSearchInfo(null);
  };

  const handleTryExample = (comps: string[]) => {
    setCompTitles(stringsToCompTitles(comps));
    setShowExamples(false);
  };

  return (
    <div className="space-y-6">
      {/* Glassmorphism Container */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8">
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
      </div>

      {/* Results */}
      {results.length > 0 && (
        <TrialResultsGrid results={results} />
      )}

      {/* Search Loading Modal - displays progress as popup for visibility */}
      <SearchLoadingModal isOpen={isLoading} />

      {/* Examples Modal */}
      <Dialog open={showExamples} onOpenChange={setShowExamples}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 border-b border-gray-100">
            <DialogTitle className="text-lg sm:text-xl font-bold text-hanok-teal">
              Explore Example Combinations
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Learn how to combine comps effectively by trying these curated examples
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <ExamplesSection
              onTryExample={handleTryExample}
              isModal={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
