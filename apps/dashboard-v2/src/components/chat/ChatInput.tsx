import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSendMessage, loading, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !loading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-300 bg-white p-4">
      <div className="max-w-6xl mx-auto flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Ask me anything about Korean content..."}
          disabled={loading}
          className="min-h-[60px] max-h-[200px] resize-none border-gray-300 focus:border-hanok-teal"
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="bg-hanok-teal hover:bg-hanok-teal/90 px-6"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      <div className="max-w-6xl mx-auto mt-2 text-xs text-gray-500 px-1">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
