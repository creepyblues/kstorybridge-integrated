// Component: MandateResultsGrid
// Created: 2025-11-21
// Description: Grid display for mandate search results

import { Loader2, Search } from 'lucide-react';
import { TitleMatch } from '@/services/mandateService';
import MandateTitleCard from './MandateTitleCard';

interface MandateResultsGridProps {
  results: TitleMatch[];
  isLoading?: boolean;
  mandateText?: string;
}

export default function MandateResultsGrid({
  results,
  isLoading = false,
  mandateText,
}: MandateResultsGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 text-hanok-teal animate-spin mb-4" />
        <p className="text-gray-600 text-sm">Finding titles that match your mandate...</p>
        <p className="text-gray-500 text-xs mt-2">This may take a few seconds</p>
      </div>
    );
  }

  // Empty state - no search yet
  if (!mandateText && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ready to Find Your Perfect Titles
        </h3>
        <p className="text-gray-600 text-sm text-center max-w-md">
          Describe your mandate above to get AI-powered title recommendations based on semantic similarity.
        </p>
      </div>
    );
  }

  // No results found
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Matches Found
        </h3>
        <p className="text-gray-600 text-sm text-center max-w-md">
          We couldn't find any titles matching your mandate. Try adjusting your criteria or being more general.
        </p>
      </div>
    );
  }

  // Calculate average match score
  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.match_score, 0) / results.length
  );

  return (
    <div className="space-y-6">
      {/* User's Mandate Prompt */}
      {mandateText && (
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-700">You</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Your Mandate
              </p>
              <p className="text-base text-gray-800 leading-relaxed">
                {mandateText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Found {results.length} {results.length === 1 ? 'Match' : 'Matches'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Average match score: <span className="font-semibold">{avgScore}%</span>
          </p>
        </div>
      </div>

      {/* Results Grid - 2 columns on medium+ screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((match) => (
          <MandateTitleCard key={match.title_id} match={match} />
        ))}
      </div>

      {/* Footer note */}
      <div className="text-center py-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Click on any title to view detailed information
        </p>
      </div>
    </div>
  );
}
