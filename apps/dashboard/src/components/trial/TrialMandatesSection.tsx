/**
 * TrialMandatesSection
 *
 * Mandate Matcher for trial users (no auth required).
 * Uses trial count limit instead of auth, does not save searches.
 */

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTrial } from '@/contexts/TrialContext';
import { mandateService, TitleMatch, MandateTiming } from '@/services/mandateService';
import MandateSearchInput from '@/components/mandates/MandateSearchInput';
import MandateExamples from '@/components/mandates/MandateExamples';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrialMandateResultsGrid } from './TrialMandateResultsGrid';
import {
  trackTrialMandateSearch,
  trackTrialMandateResults,
  trackTrialMandateExampleUsed,
  trackTrialSearchCompleted,
  trackTrialLimitReached,
} from '@/utils/analytics';

export function TrialMandatesSection() {
  const { toast } = useToast();
  const { hasTrialRemaining, incrementUsage, setShowLimitModal, remainingTrials, maxTrials } = useTrial();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasTriggeredInitialSearch = useRef(false);

  const [isLoading, setIsLoading] = useState(false);
  const [currentResults, setCurrentResults] = useState<TitleMatch[]>([]);
  const [currentMandateText, setCurrentMandateText] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [initialBrief, setInitialBrief] = useState<string>('');
  const [searchTiming, setSearchTiming] = useState<MandateTiming | null>(null);

  // Handle URL parameter for initial search
  useEffect(() => {
    const briefParam = searchParams.get('brief');
    if (briefParam && !hasTriggeredInitialSearch.current) {
      hasTriggeredInitialSearch.current = true;
      setInitialBrief(briefParam);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmitMandate = async (mandateText: string) => {
    // Check trial limit
    if (!hasTrialRemaining) {
      trackTrialLimitReached('mandates');
      setShowLimitModal(true);
      return;
    }

    // Track search initiation
    trackTrialMandateSearch(mandateText);

    try {
      setIsLoading(true);
      setCurrentMandateText(mandateText);

      // Call service with saveSearch: false for trial mode
      const response = await mandateService.searchMandates(
        mandateText,
        undefined, // No user email in trial mode
        15, // limit
        false // Don't save search
      );

      setCurrentResults(response.results);
      setSearchTiming(response.timing || null);

      // Track results
      trackTrialMandateResults(response.results.length, response.processing_time_ms);

      // Calculate searches used and track completion
      const searchesUsed = maxTrials - remainingTrials + 1;
      const newRemainingTrials = remainingTrials - 1;
      trackTrialSearchCompleted('mandates', searchesUsed, newRemainingTrials);

      // Increment trial usage only on success
      incrementUsage();

      toast({
        title: 'Search Complete',
        description: `Found ${response.results.length} matching ${
          response.results.length === 1 ? 'title' : 'titles'
        } (${response.processing_time_ms}ms)`,
      });

      window.scrollTo({ top: 400, behavior: 'smooth' });
    } catch (error) {
      console.error('Error searching mandates:', error);
      toast({
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'Failed to search. Please try again.',
        variant: 'destructive',
      });
      // Don't increment usage on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setCurrentResults([]);
    setCurrentMandateText('');
    setSearchTiming(null);
  };

  const handleTryExample = (mandateText: string) => {
    // Track example usage (use first 30 chars as example name)
    trackTrialMandateExampleUsed(mandateText.substring(0, 30) + (mandateText.length > 30 ? '...' : ''));
    setShowExamples(false);
    handleSubmitMandate(mandateText);
  };

  return (
    <div className="space-y-6">
      {/* Glassmorphism Container */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8">
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
      </div>

      {/* Results */}
      {(currentResults.length > 0 || isLoading) && (
        <TrialMandateResultsGrid
          results={currentResults}
          isLoading={isLoading}
          mandateText={currentMandateText}
        />
      )}

      {/* Examples Modal */}
      <Dialog open={showExamples} onOpenChange={setShowExamples}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 border-b border-gray-100">
            <DialogTitle className="text-lg sm:text-xl font-bold text-purple-600">
              Example Mandates
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Learn how to write effective mandate descriptions with these examples
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <MandateExamples
              onTryExample={handleTryExample}
              isModal={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
