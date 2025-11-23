/**
 * Comps Navigator Page
 *
 * Main page for the Comps Navigator feature.
 * Allows buyers to search for Korean titles based on Hollywood/global comps.
 */

import { useState } from 'react';
import { Compass, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { compsNavigatorService, TitleMatch, CompSearch } from '@/services/compsNavigatorService';
import CompSelector from '@/components/comps-navigator/CompSelector';
import RefinementInput from '@/components/comps-navigator/RefinementInput';
import ResultsGrid from '@/components/comps-navigator/ResultsGrid';
import SavedSearchesSidebar from '@/components/comps-navigator/SavedSearchesSidebar';
import ExamplesSection from '@/components/comps-navigator/ExamplesSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BuyerLayout } from '@/components/layout/BuyerLayout';

type LoadingPhase = 'semantic' | 'reranking' | null;

export default function CompsNavigator() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [compTitles, setCompTitles] = useState<string[]>([]);
  const [refinementText, setRefinementText] = useState('');
  const [results, setResults] = useState<TitleMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [searchInfo, setSearchInfo] = useState<{ time: number; cost: number } | null>(null);

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
      // Note: This is a UX approximation. Ideally, edge function would
      // send phase updates via streaming or separate API calls
      const phaseTimer = setTimeout(() => setLoadingPhase('reranking'), 1500);

      const response = await compsNavigatorService.searchComps(
        compTitles,
        refinementText || undefined,
        user.email,
        true // Save search
      );

      // Clear timer if response comes back quickly
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
    setCompTitles(search.comp_titles);
    setRefinementText(search.refinement_text || '');

    // If search has cached results, show them
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
    setCompTitles(comps);
    if (refinement) {
      setRefinementText(refinement);
    }
  };

  return (
    <BuyerLayout>
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto md:pr-80">
          <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-hanok-teal to-hanok-teal/80 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg">
                  <Compass className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-hanok-teal">Comps Navigator</h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-0.5 sm:mt-1">AI-Powered Korean Title Discovery</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Find Korean titles similar to your favorite shows and films. Select up to 3 comps to discover the perfect match using advanced semantic search.
              </p>
            </div>

            {/* Search Form */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg rounded-xl sm:rounded-2xl">
              <CardContent className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
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
                <div className="flex gap-3">
                  <Button
                    onClick={handleSearch}
                    disabled={isLoading || compTitles.length === 0}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>
                          {loadingPhase === 'semantic' && 'Finding semantic matches...'}
                          {loadingPhase === 'reranking' && 'Re-ranking with AI...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        <span className="hidden sm:inline">Find Matches</span>
                        <span className="sm:hidden">Find</span>
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
                  <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-200">
                    <span className="font-medium">
                      Search completed in {(searchInfo.time / 1000).toFixed(1)}s
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="font-medium">
                      Cost: ${searchInfo.cost.toFixed(3)}
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
        </div>

        {/* Sidebar */}
        {user?.email && (
          <SavedSearchesSidebar
            userEmail={user.email}
            onLoadSearch={handleLoadSearch}
          />
        )}
      </div>
    </BuyerLayout>
  );
}
