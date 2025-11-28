/**
 * ResultsGrid Component
 *
 * Displays search results in a responsive grid layout
 */

import { TitleMatch } from '@/services/compsNavigatorService';
import TitleMatchCard from './TitleMatchCard';

interface ResultsGridProps {
  results: TitleMatch[];
  isLoading?: boolean;
}

export default function ResultsGrid({ results, isLoading }: ResultsGridProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Searching for matches...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600 mb-2">No results yet</p>
        <p className="text-sm text-gray-500">Add comps and click "Find Matches" to search</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="space-y-2">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
          {results.length} {results.length === 1 ? 'Match' : 'Matches'} Found
        </h2>
        <p className="text-gray-600">
          AI-ranked Korean titles matching your comp combination
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((match) => (
          <TitleMatchCard key={match.title_id} match={match} />
        ))}
      </div>
    </div>
  );
}
