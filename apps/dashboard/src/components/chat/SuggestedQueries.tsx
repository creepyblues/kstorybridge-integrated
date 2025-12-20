interface SuggestedQueriesProps {
  queries: string[];
  onQueryClick: (query: string, position: number) => void;
  disabled?: boolean;
}

/**
 * SuggestedQueries Component
 * Displays follow-up question suggestions that auto-execute on click
 * Passes 1-indexed position for analytics tracking
 */
export const SuggestedQueries = ({ queries, onQueryClick, disabled = false }: SuggestedQueriesProps) => {
  if (!queries || queries.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-500 mb-3">Try these:</p>
      <div className="flex flex-wrap gap-2">
        {queries.map((query, idx) => (
          <button
            key={idx}
            onClick={() => onQueryClick(query, idx + 1)}
            disabled={disabled}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
};
