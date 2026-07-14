import { Icon } from '@iconify/react';
import { trackChatExampleClicked } from '@/utils/analytics';

interface ChatEmptyStateProps {
  onQuerySelect: (query: string, source?: 'typed' | 'example' | 'suggestion' | 'url_param') => void;
  suggestedQueries: string[];
}

export function ChatEmptyState({ onQuerySelect, suggestedQueries }: ChatEmptyStateProps) {
  const handleExampleClick = (query: string) => {
    // Track example click for GA4 analytics
    trackChatExampleClicked();
    // Execute with 'example' source
    onQuerySelect(query, 'example');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-hanok-teal/10 rounded-full p-4">
            <Icon icon="solar:robot-bold-duotone" className="h-12 w-12 text-hanok-teal" />
          </div>
        </div>

        {/* Greeting */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-black">
            Hi, I'm Jinu!
          </h2>
          <p className="text-gray-600">
            I'm your AI assistant for discovering Korean content. Ask me about webtoons, web novels, or describe what you're looking for.
          </p>
        </div>

        {/* Suggested Queries */}
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Try these examples:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(query)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
