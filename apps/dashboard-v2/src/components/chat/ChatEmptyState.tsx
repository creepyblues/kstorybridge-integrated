import { Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatEmptyStateProps {
  onQuerySelect: (query: string) => void;
  suggestedQueries: string[];
}

export function ChatEmptyState({ onQuerySelect, suggestedQueries }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-hanok-teal/10 rounded-full p-4">
            <Bot className="h-12 w-12 text-hanok-teal" />
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
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Sparkles className="h-4 w-4" />
            <span>Try asking:</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {suggestedQueries.map((query, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto py-3 px-4 text-left justify-start border-gray-300 hover:bg-gray-50 hover:border-hanok-teal transition-colors"
                onClick={() => onQuerySelect(query)}
              >
                <span className="text-gray-700">{query}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-sm">
          <div className="space-y-1">
            <div className="font-semibold text-black">🔍 Smart Search</div>
            <div className="text-gray-500">Vector search with 10+ results per query</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-black">🎯 Context Aware</div>
            <div className="text-gray-500">Remembers conversation context</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-black">📊 Rich Details</div>
            <div className="text-gray-500">Pitch analytics when available</div>
          </div>
        </div>
      </div>
    </div>
  );
}
