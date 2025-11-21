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

  return (
    <BuyerLayout>
      <div className="flex h-screen bg-gray-50">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Compass className="h-10 w-10 text-hanok-teal" />
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Comps Navigator</h1>
                  <p className="text-lg text-gray-600 mt-1">AI-Powered Korean Title Discovery</p>
                </div>
              </div>
              <p className="text-gray-600 text-base">
                Find Korean titles similar to your favorite shows and films. Select up to 3 comps to discover the perfect match using advanced semantic search.
              </p>
            </div>

            {/* Search Form */}
            <Card className="bg-white border border-gray-300 shadow-sm rounded-2xl">
              <CardContent className="p-6 md:p-8 space-y-6">
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
                        <span>Find Matches</span>
                      </>
                    )}
                  </Button>

                  {(compTitles.length > 0 || refinementText || results.length > 0) && (
                    <Button
                      onClick={handleClear}
                      disabled={isLoading}
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Search Info */}
                {searchInfo && !isLoading && (
                  <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t border-gray-200">
                    <span>
                      Search completed in {(searchInfo.time / 1000).toFixed(1)}s
                    </span>
                    <span>•</span>
                    <span>
                      Cost: ${searchInfo.cost.toFixed(3)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Example Searches */}
            {results.length === 0 && !isLoading && (
              <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 shadow-sm rounded-2xl">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    Popular Comp Combinations
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Try these example searches to discover Korean titles with similar themes and tones
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setCompTitles(['Squid Game', 'Parasite', 'Black Mirror'])}
                      className="block w-full text-left px-4 py-3 bg-white rounded-lg text-sm font-medium text-gray-900 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-cyan-200"
                    >
                      <span className="text-cyan-600">→</span> Squid Game + Parasite + Black Mirror
                    </button>
                    <button
                      onClick={() => setCompTitles(['Stranger Things', 'Dark'])}
                      className="block w-full text-left px-4 py-3 bg-white rounded-lg text-sm font-medium text-gray-900 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-cyan-200"
                    >
                      <span className="text-cyan-600">→</span> Stranger Things + Dark
                    </button>
                    <button
                      onClick={() => setCompTitles(['Money Heist', 'Breaking Bad', 'Ozark'])}
                      className="block w-full text-left px-4 py-3 bg-white rounded-lg text-sm font-medium text-gray-900 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-cyan-200"
                    >
                      <span className="text-cyan-600">→</span> Money Heist + Breaking Bad + Ozark
                    </button>
                  </div>
                </CardContent>
              </Card>
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
