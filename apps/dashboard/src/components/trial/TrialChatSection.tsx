/**
 * TrialChatSection
 *
 * AI Chatbot for trial users (no auth required).
 * Uses trial count limit instead of auth, does not save chat history.
 * Each message counts as 1 trial search (3 total across all tools).
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTrial } from '@/contexts/TrialContext';
import { supabase } from '@/lib/supabase';
import { ChatInput } from '@/components/chat/ChatInput';
import ChatProcessingStatus from '@/components/chat/ChatProcessingStatus';
import { ChatPhase, RichExplanation } from '@/services/chatOrchestratorService';
import { getRandomChatbotQueries } from '@/data/examplesData';
import {
  trackTrialChatMessageSent,
  trackTrialChatResponse,
  trackTrialChatSuggestionClicked,
  trackTrialSearchCompleted,
  trackTrialLimitReached,
} from '@/utils/analytics';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  titles?: any[];
  explanations?: RichExplanation[];
}

export function TrialChatSection() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hasTrialRemaining, incrementUsage, setShowLimitModal, remainingTrials, maxTrials } = useTrial();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingPhase, setProcessingPhase] = useState<ChatPhase>(null);
  const [searchCount, setSearchCount] = useState<number | undefined>(undefined);

  // Use centralized suggestion data from examplesData.ts
  const suggestedQueries = useMemo(() => getRandomChatbotQueries(3), []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message: string, inputType: 'typed' | 'suggested' = 'typed') => {
    // Check trial limit
    if (!hasTrialRemaining) {
      trackTrialLimitReached('chat');
      setShowLimitModal(true);
      return;
    }

    // Track message sent
    trackTrialChatMessageSent(message.length, inputType);

    // Add user message to UI
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
    };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);
    setProcessingPhase('analyzing');
    setSearchCount(undefined);

    try {
      // Call edge function directly with supabase.functions.invoke (no auth required)
      const { data, error } = await supabase.functions.invoke('chat-orchestrator', {
        body: {
          messages: [{ role: 'user', content: message }],
          userId: 'trial-user',
          trialMode: true, // Flag for edge function to skip auth
        },
      });

      if (error) {
        throw new Error(error.message || 'Chat request failed');
      }

      // Parse response - the edge function returns SSE format, but invoke() buffers it
      // For trial mode, we'll get a simplified JSON response
      let response = '';
      let titles: any[] = [];
      let explanations: RichExplanation[] = [];

      if (typeof data === 'string') {
        // Parse SSE response
        const lines = data.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.type === 'text') {
                response += parsed.text;
              } else if (parsed.type === 'titles') {
                titles = parsed.titles || [];
              } else if (parsed.type === 'search_complete') {
                setProcessingPhase('searching');
                setSearchCount(parsed.resultsCount);
                if (parsed.topTitles) {
                  titles = parsed.topTitles;
                }
              } else if (parsed.type === 'explanations_ready') {
                explanations = parsed.explanations || [];
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      } else if (data) {
        // Direct JSON response
        response = data.response || data.text || '';
        titles = data.titles || [];
        explanations = data.explanations || [];
      }

      setProcessingPhase('generating');

      // Add bot response
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: response || "I found some titles that might interest you!",
        titles,
        explanations,
      };
      setMessages(prev => [...prev, botMessage]);

      // Track response
      trackTrialChatResponse(titles.length, processingPhase || 'complete');

      // Calculate searches used and track completion
      const searchesUsed = maxTrials - remainingTrials + 1;
      const newRemainingTrials = remainingTrials - 1;
      trackTrialSearchCompleted('chat', searchesUsed, newRemainingTrials);

      // Increment trial usage on success
      incrementUsage();

      setProcessingPhase('complete');

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Failed",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive"
      });
      // Don't increment usage on error
    } finally {
      setIsLoading(false);
      setTimeout(() => setProcessingPhase(null), 1500);
    }
  };

  const handleSuggestedQuery = (query: string) => {
    // Track suggestion click
    trackTrialChatSuggestionClicked(query);
    handleSendMessage(query, 'suggested');
  };

  const handleTitleClick = (titleId: string) => {
    navigate(`/trial/titles/${titleId}?source=chat`);
  };

  return (
    <div className="space-y-4">
      {/* Chat Container - same width as menu box (max-w-4xl controlled by parent) */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Messages Area */}
        <div className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            // Empty State
            <div className="text-center py-8">
              <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">Ask AI Anything</h2>
              <p className="text-sm text-gray-600 mb-4">Try asking:</p>
              {/* Suggested Queries - from examplesData.ts */}
              <div className="flex flex-wrap justify-center gap-1.5">
                {suggestedQueries.map((query, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuery(query)}
                    className="px-2.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Messages
            <>
              {messages.map((msg) => (
                <div key={msg.id}>
                  {/* Message Bubble */}
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-hanok-teal text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>

                  {/* Title Results (for bot messages) */}
                  {msg.role === 'assistant' && msg.titles && msg.titles.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {msg.titles.slice(0, 6).map((title: any) => {
                        const titleId = title.title_id || title.id;
                        const titleNameEn = title.title_name_en || title.nameEn || title.title_name_kr;
                        const titleNameKr = title.title_name_kr || title.nameKr;
                        const explanation = msg.explanations?.find(e => e.title_id === titleId);

                        return (
                          <div
                            key={titleId}
                            onClick={() => handleTitleClick(titleId)}
                            className="bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-hanok-teal hover:shadow-md transition-all"
                          >
                            <div className="flex gap-3">
                              {title.title_image && (
                                <img
                                  src={title.title_image}
                                  alt={titleNameEn}
                                  className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">
                                  {titleNameEn}
                                </h4>
                                {titleNameKr && titleNameKr !== titleNameEn && (
                                  <p className="text-xs text-gray-500 truncate">{titleNameKr}</p>
                                )}
                                {title.genre && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(Array.isArray(title.genre) ? title.genre : [title.genre]).slice(0, 2).map((g: string, i: number) => (
                                      <span key={i} className="px-1.5 py-0.5 text-[10px] bg-gray-100 rounded text-gray-600">
                                        {g}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {explanation && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {explanation.explanation_narrative}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Processing Status */}
              {isLoading && processingPhase && (
                <ChatProcessingStatus phase={processingPhase} searchCount={searchCount} />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/50">
          <ChatInput
            onSendMessage={handleSendMessage}
            loading={isLoading}
            placeholder=""
            showHint={false}
          />
        </div>
      </div>
    </div>
  );
}
