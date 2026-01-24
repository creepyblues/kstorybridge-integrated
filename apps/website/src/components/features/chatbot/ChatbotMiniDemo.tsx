import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Send, User } from 'lucide-react';
import { Button } from '@kstorybridge/ui';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

/**
 * ChatbotMiniDemo Component
 *
 * Interactive simulated chat interface showing:
 * - Example user query
 * - Animated typing response from Jinu
 * - Clickable example query buttons
 */
export function ChatbotMiniDemo() {
  const { t } = useTranslation('features');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<number | null>(null);

  const exampleQueries = t('chatbot.demo.exampleQueries', { returnObjects: true }) as string[];

  const handleQueryClick = (index: number) => {
    if (isAnimating) return;

    setSelectedQuery(index);
    setIsAnimating(true);

    // Add user message
    setMessages([
      { role: 'user', content: exampleQueries[index] }
    ]);

    // Simulate typing delay
    setTimeout(() => {
      setMessages([
        { role: 'user', content: exampleQueries[index] },
        { role: 'assistant', content: '', isTyping: true }
      ]);
    }, 500);

    // Show response
    setTimeout(() => {
      setMessages([
        { role: 'user', content: exampleQueries[index] },
        {
          role: 'assistant',
          content: t('chatbot.demo.response.body')
        }
      ]);
      setIsAnimating(false);
    }, 2000);
  };

  // Auto-play first query on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleQueryClick(0);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-hanok-teal px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-white font-medium text-sm">Jinu</p>
          <p className="text-white/80 text-xs">AI Story Expert</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-white/80 text-xs">Online</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="p-4 min-h-[200px] max-h-[300px] overflow-y-auto space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-midnight-ink-600 text-sm py-8">
            <Bot className="h-8 w-8 mx-auto mb-2 text-hanok-teal/50" />
            <p>{t('chatbot.demo.placeholder')}</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              } animate-fade-in-up`}
            >
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-gray-200'
                    : 'bg-hanok-teal'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-4 w-4 text-gray-600" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-gray-200 text-midnight-ink'
                    : 'bg-hanok-teal/10 text-midnight-ink'
                }`}
              >
                {message.isTyping ? (
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-hanok-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-hanok-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-hanok-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                ) : (
                  <>
                    {message.role === 'assistant' && (
                      <p className="font-semibold text-sm mb-1">
                        {t('chatbot.demo.response.title')}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Example Query Buttons */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <p className="text-xs text-midnight-ink-600 mb-2">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.slice(0, 2).map((query, index) => (
            <button
              key={index}
              onClick={() => handleQueryClick(index)}
              disabled={isAnimating}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                selectedQuery === index
                  ? 'bg-hanok-teal text-white border-hanok-teal'
                  : 'bg-white text-midnight-ink-600 border-gray-300 hover:border-hanok-teal hover:text-hanok-teal'
              } ${isAnimating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {query.length > 40 ? query.substring(0, 40) + '...' : query}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar (Decorative) */}
      <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
        <input
          type="text"
          placeholder={t('chatbot.demo.placeholder')}
          className="flex-1 text-sm px-3 py-2 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-hanok-teal/50"
          disabled
        />
        <button className="w-8 h-8 bg-hanok-teal rounded-full flex items-center justify-center opacity-50 cursor-not-allowed">
          <Send className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}

export default ChatbotMiniDemo;
