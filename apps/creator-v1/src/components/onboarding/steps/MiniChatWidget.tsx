import { useState } from "react";
import { Button, Input } from "@kstorybridge/ui";
import { Send, Bot, Loader2 } from "lucide-react";
import { openaiService } from "@/services/openaiService";
import { useAuth } from "@/hooks/useAuth";

interface MiniChatWidgetProps {
  onComplete: () => void;
}

export default function MiniChatWidget({ onComplete }: MiniChatWidgetProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      // Call real OpenAI service
      const result = await openaiService.chat(message, [], user?.email || 'anonymous');

      setResponse(result);

      // Mark as complete after successful chat
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get response. You can skip this step or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4">
      {/* Chat Interface */}
      <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
        {!response && !isLoading && (
          <div className="flex items-start gap-3 text-gray-500">
            <Bot className="w-5 h-5 mt-1 flex-shrink-0" />
            <p className="text-sm">
              Hi! I'm Jinu, your AI assistant. Ask me to find Korean content for you!
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-start gap-3">
            <Bot className="w-5 h-5 mt-1 flex-shrink-0 text-hanok-teal" />
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}

        {response && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-gray-700 bg-white rounded-lg p-3">
              <Bot className="w-5 h-5 mt-1 flex-shrink-0 text-hanok-teal" />
              <div className="text-sm leading-relaxed">
                {response.slice(0, 200)}
                {response.length > 200 && '...'}
              </div>
            </div>
            <p className="text-center text-sm text-hanok-teal font-medium">
              ✓ Great! You've used AI search successfully
            </p>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Try: 'romance webtoon with strong female lead'"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading || !!response}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading || !!response}
          className="bg-hanok-teal hover:bg-hanok-teal/90 text-white"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        This is a real AI search - your query will be processed by our chatbot
      </p>
    </div>
  );
}
