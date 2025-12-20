// Page: Mandates
// Created: 2025-11-21
// Updated: 2025-12-02
// Route: /buyers/mandates
// Description: Producer mandate-based title recommendation system
// Design: Follows BriefSearch pattern from Home page

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { mandateService, MandateSearch, TitleMatch, MandateTiming } from '@/services/mandateService';
import MandateSearchInput from '@/components/mandates/MandateSearchInput';
import MandateExamples from '@/components/mandates/MandateExamples';
import MandateHistorySidebar from '@/components/mandates/MandateHistorySidebar';
import MandateResultsGrid from '@/components/mandates/MandateResultsGrid';
import MandateSearchLoadingModal from '@/components/mandates/MandateSearchLoadingModal';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Icon } from '@iconify/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trackPageView, trackFeatureUsage, trackMandateSearchSubmitted, trackMandateExampleUsed, trackSearchZeroResults, trackSessionSearches } from '@/utils/analytics';

export default function Mandates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasTriggeredInitialSearch = useRef(false);
  const searchCountRef = useRef(0); // Track searches per session for analytics

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentResults, setCurrentResults] = useState<TitleMatch[]>([]);
  const [currentMandateText, setCurrentMandateText] = useState('');
  const [selectedMandateId, setSelectedMandateId] = useState<string | undefined>();
  const [mandateHistory, setMandateHistory] = useState<MandateSearch[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [initialBrief, setInitialBrief] = useState<string>('');
  const [searchTiming, setSearchTiming] = useState<MandateTiming | null>(null);

  // Track page view on mount
  useEffect(() => {
    trackPageView('/buyers/mandates', 'Mandate Search');
    trackFeatureUsage('mandate_search');
  }, []);

  // Track session searches on page leave
  useEffect(() => {
    return () => {
      if (searchCountRef.current > 0) {
        trackSessionSearches('mandates', searchCountRef.current);
      }
    };
  }, []);

  // Load mandate history on mount
  useEffect(() => {
    loadMandateHistory();
  }, []);

  // Handle URL parameter for initial search
  useEffect(() => {
    const briefParam = searchParams.get('brief');
    if (briefParam && !hasTriggeredInitialSearch.current && user?.email) {
      hasTriggeredInitialSearch.current = true;
      setInitialBrief(briefParam);
      // Clear the URL parameter
      setSearchParams({}, { replace: true });
      // Trigger search
      handleSubmitMandate(briefParam);
    }
  }, [searchParams, user?.email]);

  const loadMandateHistory = async () => {
    if (!user?.email) return;

    try {
      setIsLoadingHistory(true);
      const mandates = await mandateService.getRecentMandates(user.email);
      setMandateHistory(mandates);
    } catch (error) {
      console.error('Error loading mandate history:', error);
      toast({
        title: 'Error Loading History',
        description: 'Failed to load your previous mandates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmitMandate = async (mandateText: string) => {
    if (!user?.email) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to search mandates.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      setCurrentMandateText(mandateText);

      // Increment search counter for session analytics
      searchCountRef.current += 1;

      // Call the mandate matcher service
      const response = await mandateService.searchMandates(mandateText, user.email);

      setCurrentResults(response.results);
      setSelectedMandateId(response.search_id);
      setSearchTiming(response.timing || null);

      // Track mandate search submitted
      trackMandateSearchSubmitted(mandateText, response.results.length, response.processing_time_ms);

      // Track zero results for search quality analysis
      if (response.results.length === 0) {
        trackSearchZeroResults(mandateText, 'mandate');
      }

      // Reload history to show the new search
      await loadMandateHistory();

      // Show success toast
      toast({
        title: 'Search Complete',
        description: `Found ${response.results.length} matching ${
          response.results.length === 1 ? 'title' : 'titles'
        } (${response.processing_time_ms}ms)`,
      });

      // Scroll to results
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } catch (error) {
      console.error('Error searching mandates:', error);
      toast({
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'Failed to search mandates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMandate = (mandate: MandateSearch) => {
    setCurrentResults(mandate.search_results);
    setCurrentMandateText(mandate.mandate_text);
    setSelectedMandateId(mandate.id);

    // Scroll to results
    window.scrollTo({ top: 400, behavior: 'smooth' });

    toast({
      title: 'Mandate Loaded',
      description: `Showing ${mandate.result_count} ${
        mandate.result_count === 1 ? 'result' : 'results'
      }`,
    });
  };

  const handleDeleteMandate = async (mandateId: string) => {
    try {
      await mandateService.deleteMandate(mandateId);

      // Remove from local state
      setMandateHistory((prev) => prev.filter((m) => m.id !== mandateId));

      // Clear current results if deleted mandate was selected
      if (selectedMandateId === mandateId) {
        setCurrentResults([]);
        setCurrentMandateText('');
        setSelectedMandateId(undefined);
      }

      toast({
        title: 'Mandate Deleted',
        description: 'The mandate has been removed from your history.',
      });
    } catch (error) {
      console.error('Error deleting mandate:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete mandate. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClear = () => {
    setCurrentResults([]);
    setCurrentMandateText('');
    setSelectedMandateId(undefined);
    setSearchTiming(null);
  };

  const handleTryExample = (mandateText: string) => {
    // Track example usage
    trackMandateExampleUsed(mandateText);

    setShowExamples(false);
    handleSubmitMandate(mandateText);
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
              <Icon icon="solar:clock-circle-bold-duotone" className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </div>
        )}

        {/* Search Input */}
        <MandateSearchInput
          onSearch={handleSubmitMandate}
          onClear={handleClear}
          onNeedHelp={() => setShowExamples(true)}
          isLoading={isLoading}
          hasResults={currentResults.length > 0}
          initialValue={initialBrief}
          timing={searchTiming}
        />

        {/* Results */}
        {(currentResults.length > 0 || isLoading) && (
          <MandateResultsGrid
            results={currentResults}
            isLoading={isLoading}
            mandateText={currentMandateText}
          />
        )}
      </div>

      {/* Search Loading Modal */}
      <MandateSearchLoadingModal isOpen={isLoading} />

      {/* History Dialog */}
      {user?.email && (
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-md max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Mandate History</DialogTitle>
            </DialogHeader>
            <MandateHistorySidebar
              mandates={mandateHistory}
              selectedMandateId={selectedMandateId}
              onSelectMandate={(mandate) => {
                handleSelectMandate(mandate);
                setShowHistory(false);
              }}
              onDeleteMandate={handleDeleteMandate}
              isLoading={isLoadingHistory}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Examples Modal */}
      <Dialog open={showExamples} onOpenChange={setShowExamples}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 border-b border-gray-100">
            <DialogTitle className="text-lg sm:text-xl font-bold text-purple-600">
              Example Mandates
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              Learn how to write effective mandate descriptions with these examples
            </p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <MandateExamples
              onTryExample={handleTryExample}
              isModal={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </BuyerLayout>
  );
}
