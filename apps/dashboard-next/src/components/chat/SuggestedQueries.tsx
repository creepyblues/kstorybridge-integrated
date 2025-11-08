import { Button } from "@kstorybridge/ui";

interface SuggestedQueriesProps {
  queries: string[];
  onQueryClick: (query: string) => void;
  disabled?: boolean;
}

/**
 * SuggestedQueries Component
 * Displays follow-up question suggestions that auto-execute on click
 */
export const SuggestedQueries = ({ queries, onQueryClick, disabled = false }: SuggestedQueriesProps) => {
  if (!queries || queries.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <span className="text-xs text-gray-500">Try:</span>
      <div className="flex flex-wrap gap-2">
        {queries.map((query, idx) => (
          <button
            key={idx}
            onClick={() => onQueryClick(query)}
            disabled={disabled}
            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-50"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
};
