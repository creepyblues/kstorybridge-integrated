import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSendMessage, loading, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

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
    <div className="w-full">
      {/* Input container with ChatGPT-style design */}
      <div className="flex items-center bg-white border border-gray-200 rounded-3xl shadow-lg px-5 py-2">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Ask me about Korean webtoons, web novels..."}
          disabled={loading}
          rows={1}
          className="flex-1 resize-none border-0 bg-transparent py-2 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 max-h-[200px] overflow-auto"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="ml-2 p-2.5 rounded-xl bg-hanok-teal hover:bg-hanok-teal/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
          aria-label="Send message"
        >
          {loading ? (
            <Icon icon="solar:refresh-circle-bold-duotone" className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Icon icon="solar:plain-bold-duotone" className="h-5 w-5 text-white" />
          )}
        </button>
      </div>

      {/* Footer hint text */}
      <p className="text-xs text-gray-500 text-center mt-3 px-4">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
