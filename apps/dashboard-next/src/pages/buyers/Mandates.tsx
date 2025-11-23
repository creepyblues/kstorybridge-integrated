// Page: Mandates
// Created: 2025-11-21
// Route: /buyers/mandates
// Description: Producer mandate-based title recommendation system

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { mandateService, MandateSearch, TitleMatch } from '@/services/mandateService';
import MandateInput from '@/components/mandates/MandateInput';
import MandateHistorySidebar from '@/components/mandates/MandateHistorySidebar';
import MandateResultsGrid from '@/components/mandates/MandateResultsGrid';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Sparkles } from 'lucide-react';

export default function Mandates() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentResults, setCurrentResults] = useState<TitleMatch[]>([]);
  const [currentMandateText, setCurrentMandateText] = useState('');
  const [selectedMandateId, setSelectedMandateId] = useState<string | undefined>();
  const [mandateHistory, setMandateHistory] = useState<MandateSearch[]>([]);

  // Load mandate history on mount
  useEffect(() => {
    loadMandateHistory();
  }, []);

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

      // Call the mandate matcher service
      const response = await mandateService.searchMandates(mandateText, user.email);

      setCurrentResults(response.results);
      setSelectedMandateId(response.search_id);

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

  return (
    <BuyerLayout>
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-hanok-teal to-hanok-teal/80 p-3 rounded-2xl shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-hanok-teal">Mandate Matcher</h1>
                  <p className="text-lg text-gray-600 mt-1">AI-Powered Title Recommendations</p>
                </div>
              </div>
              <p className="text-gray-600 text-base">
                Find titles that match your production mandates using AI-powered semantic search. Describe what you're
                looking for and get instant recommendations.
              </p>
            </div>

            {/* Input Section */}
            <MandateInput onSubmit={handleSubmitMandate} isLoading={isLoading} />

            {/* Results Section */}
            <MandateResultsGrid
              results={currentResults}
              isLoading={isLoading}
              mandateText={currentMandateText}
            />
          </div>
        </div>

        {/* Sidebar - Hidden on mobile */}
        {user?.email && (
          <div className="hidden md:block">
            <MandateHistorySidebar
              mandates={mandateHistory}
              selectedMandateId={selectedMandateId}
              onSelectMandate={handleSelectMandate}
              onDeleteMandate={handleDeleteMandate}
              isLoading={isLoadingHistory}
            />
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
