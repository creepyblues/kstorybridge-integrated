import { useState, useRef } from "react";
import { Send } from "lucide-react";

interface ChatEmptyStateProps {
  onSubmitMessage: (message: string) => void;
  isLoading?: boolean;
  showHistory?: boolean;
  onToggleHistory?: () => void;
}

export const ChatEmptyState = ({ onSubmitMessage, isLoading = false, showHistory = false, onToggleHistory }: ChatEmptyStateProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!inputMessage.trim() || isLoading) return;
    onSubmitMessage(inputMessage.trim());
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start pt-[33vh]">
      <div className="w-full max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-midnight-ink mb-4">
            What type of story are you after today?
          </h1>
        </div>

        {/* Centered Input */}
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
          <div className="flex items-end gap-2 p-4">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Describe the story you need, and I'll curate options..."
              className="flex-1 max-h-32 px-4 py-3 resize-none focus:outline-none text-base placeholder-gray-400"
              rows={1}
              disabled={isLoading}
              style={{
                minHeight: '48px',
                overflowY: 'hidden'
              }}
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={!inputMessage.trim() || isLoading}
              className={`p-3 rounded-lg transition-colors ${
                inputMessage.trim() && !isLoading
                  ? 'bg-gray-700 text-white hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center mt-6">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="text-sm">Starting conversation...</span>
            </div>
          </div>
        )}

        {/* Go back to Chat history link */}
        {onToggleHistory && (
          <div className="mt-6">
            <button
              onClick={onToggleHistory}
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 transition-colors"
            >
              {showHistory ? '← Back to current chat' : '→ Chat History'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};