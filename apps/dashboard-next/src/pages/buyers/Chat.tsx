import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ConversationalMessage } from '@/components/chat/ConversationalMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TitleCard } from '@/components/title/TitleCard';
import { SuggestedQueries } from '@/components/chat/SuggestedQueries';
import { chatOrchestratorService } from '@/services/chatOrchestratorService';
import { chatHistoryService, type ChatSession } from '@/services/chatHistoryService';
import { supabase } from '@/lib/supabase';
import { BuyerLayout } from '@/components/layout/BuyerLayout';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  titles?: any[];
  suggestedQueries?: string[];
  messageId?: string; // Database message ID for tracking
}

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [titleCache, setTitleCache] = useState<any[]>([]); // Cache for ALL titles for fuzzy matching
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const suggestedQueries = chatOrchestratorService.getSuggestedQueries();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // User change detection - reset chat when user changes
  useEffect(() => {
    if (user?.id) {
      if (previousUserIdRef.current && previousUserIdRef.current !== user.id) {
        console.log('[UserChange] User changed, resetting chat state');
        setMessages([]);
        setCurrentSession(null);
        setHasLoadedHistory(false);
      }
      previousUserIdRef.current = user.id;
    } else {
      if (previousUserIdRef.current) {
        console.log('[UserChange] User logged out, clearing chat state');
        setMessages([]);
        setCurrentSession(null);
        setHasLoadedHistory(false);
        previousUserIdRef.current = null;
      }
    }
  }, [user?.id]);

  // Initialize session and load title cache
  useEffect(() => {
    const initializeChat = async () => {
      if (!user?.id || !user?.email) return;

      try {
        // Load title cache for fuzzy matching (ALL titles)
        console.log('📚 Loading title cache for fuzzy matching...');
        const { data: allTitles, error: titlesError } = await supabase
          .from('titles')
          .select('title_id, title_name_en, title_name_kr')
          .limit(1500);

        if (titlesError) {
          console.error('Error loading title cache:', titlesError);
        } else if (allTitles) {
          setTitleCache(allTitles);
          console.log(`✅ Loaded ${allTitles.length} titles into cache for matching`);
        }

        // Get or create session
        let session = await chatHistoryService.getActiveSession(user.id, 'openai');

        if (!session) {
          console.log('🆕 Creating new chat session');
          session = await chatHistoryService.createSession({
            user_id: user.id,
            user_email: user.email,
            session_type: 'openai',
          });
        }

        if (session) {
          setCurrentSession(session);
          console.log('✅ Session initialized:', session.id);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initializeChat();
  }, [user?.id, user?.email]);

  // Load message history from database
  useEffect(() => {
    const loadHistory = async () => {
      if (!currentSession || hasLoadedHistory) return;

      setIsLoadingHistory(true);
      try {
        const history = await chatHistoryService.getSessionMessagesWithData(currentSession.id);

        if (history && history.length > 0) {
          const formattedMessages: Message[] = history.map((msg: any) => ({
            id: msg.id,
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: msg.timestamp,
            titles: msg.titles,
            suggestedQueries: msg.suggestedQueries,
            messageId: msg.messageId || msg.id,
          }));

          setMessages(formattedMessages);
          console.log(`📜 Loaded ${formattedMessages.length} messages from history`);
        }

        setHasLoadedHistory(true);
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [currentSession, hasLoadedHistory]);

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || loading || !user?.id || !currentSession) return;

    const startTime = Date.now();

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setLoading(true);

    try {
      // Record user message in database
      const userDbMessage = await chatHistoryService.recordMessage({
        session_id: currentSession.id,
        user_id: user.id,
        message_type: 'user_prompt',
        content: query,
      });

      if (userDbMessage) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempUserMessage.id
              ? { ...msg, id: userDbMessage.id, messageId: userDbMessage.id }
              : msg
          )
        );
      }

      // Prepare conversation history for API
      const conversationHistory = messages
        .filter((msg) => !msg.id.startsWith('temp-'))
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Send to chatbot orchestrator
      const response = await chatOrchestratorService.sendMessage(
        query,
        conversationHistory,
        user.id
      );

      const responseTime = Date.now() - startTime;

      // Record bot response in database
      const botDbMessage = await chatHistoryService.recordMessage({
        session_id: currentSession.id,
        user_id: user.id,
        message_type: 'ai_response',
        content: response.response,
        response_time_ms: responseTime,
      });

      // Record title recommendations if any
      if (botDbMessage && response.titles && response.titles.length > 0) {
        const recommendations = response.titles.map((title: any, index: number) => ({
          message_id: botDbMessage.id,
          session_id: currentSession.id,
          title_id: title.title_id,
          title_name_en: title.title_name_en,
          title_name_kr: title.title_name_kr,
          recommendation_score: title.score || (1 - index * 0.1),
          recommendation_reason: title.reason,
        }));

        await chatHistoryService.recordRecommendations(recommendations);
      }

      // Record suggested queries if any
      if (botDbMessage && response.suggestedQueries && response.suggestedQueries.length > 0) {
        const queries = response.suggestedQueries.map((q: string, index: number) => ({
          message_id: botDbMessage.id,
          session_id: currentSession.id,
          suggested_query: q,
          query_position: index,
        }));

        await chatHistoryService.recordSuggestedQueries(queries);
      }

      // Add bot response to UI
      const botMessage: Message = {
        id: botDbMessage?.id || `temp-bot-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        titles: response.titles?.map((t: any) => chatOrchestratorService.formatTitleForChat(t)),
        suggestedQueries: response.suggestedQueries,
        messageId: botDbMessage?.id,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error('❌ Chat error', error);

      toast({
        title: 'Error',
        description: error.message || 'Failed to get response from chatbot',
        variant: 'destructive',
      });

      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuery = async (query: string, messageId?: string) => {
    if (!user?.id || !currentSession) return;

    // Mark query as clicked in database
    if (messageId) {
      await chatHistoryService.markQueryAsClicked(messageId, query);
    }

    // Track suggestion click
    await chatHistoryService.recordInteraction({
      session_id: currentSession.id,
      user_id: user.id,
      interaction_type: 'suggestion_click',
      target_title: query,
      metadata: { clicked_at: new Date().toISOString() },
    });

    // Execute the query
    await handleSendMessage(query);
  };

  const handleTitleClick = async (titleId: string, titleName: string) => {
    if (!user?.id || !currentSession) return;

    // Track title click
    await chatHistoryService.recordInteraction({
      session_id: currentSession.id,
      user_id: user.id,
      interaction_type: 'title_click',
      target_id: titleId,
      target_title: titleName,
      metadata: { clicked_at: new Date().toISOString() },
    });

    // Navigate to title detail
    navigate(`/buyers/titles/${titleId}`);
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <BuyerLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="border-b border-gray-300 bg-white px-4 py-3 -mx-4 sm:-mx-6 lg:-mx-8 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-black">Jinu AI Chatbot</h1>
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewChat}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Chat
                </Button>
              )}
            </div>
          </div>
        </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-hanok-teal" />
              <p className="text-sm text-gray-600">Loading chat history...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <ChatEmptyState
            onQuerySelect={handleSendMessage}
            suggestedQueries={suggestedQueries}
          />
        ) : (
          <div className="max-w-6xl mx-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={message.id} className="space-y-3">
                {/* User Message - use basic ChatMessage */}
                {message.role === 'user' && (
                  <ChatMessage message={message} isLatest={index === messages.length - 1} />
                )}

                {/* Bot Message - use ConversationalMessage with title linking */}
                {message.role === 'assistant' && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-hanok-teal flex items-center justify-center text-white font-bold text-sm">
                      J
                    </div>
                    <div className="flex-1">
                      <ConversationalMessage
                        content={message.content}
                        navigate={navigate}
                        titleData={message.titles}
                        allMessages={messages}
                        titleCache={titleCache}
                        handleSuggestedQuery={handleSuggestedQuery}
                      />

                      {/* Suggested Queries */}
                      {message.suggestedQueries && message.suggestedQueries.length > 0 && (
                        <div className="mt-4">
                          <SuggestedQueries
                            queries={message.suggestedQueries}
                            onQuerySelect={(query) => handleSuggestedQuery(query, message.messageId)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Title Cards (shown below bot messages) */}
                {message.titles && message.titles.length > 0 && message.role === 'assistant' && (
                  <div className="ml-11 space-y-2">
                    <p className="text-sm text-gray-600 font-medium">
                      Found {message.titles.length} title{message.titles.length !== 1 ? 's' : ''}:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {message.titles.slice(0, 6).map((title: any, titleIndex: number) => (
                        <div
                          key={`${message.id}-title-${title.id || titleIndex}`}
                          onClick={() => handleTitleClick(title.id, title.nameEn || title.nameKr)}
                          className="cursor-pointer"
                        >
                          <TitleCard title={title} variant="compact" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-gray-500 ml-11">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Jinu is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

        {/* Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          loading={loading}
          placeholder="Ask me about Korean webtoons, web novels, or describe what you're looking for..."
        />
      </div>
    </BuyerLayout>
  );
}
