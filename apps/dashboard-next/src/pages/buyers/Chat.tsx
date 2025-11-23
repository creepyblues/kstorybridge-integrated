import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ConversationalMessage } from '@/components/chat/ConversationalMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TitleCard } from '@/components/title/TitleCard';
import { SuggestedQueries } from '@/components/chat/SuggestedQueries';
import ChatHistorySidebar from '@/components/chat/ChatHistorySidebar';
import { chatOrchestratorService } from '@/services/chatOrchestratorService';
import { chatHistoryService, type ChatSession } from '@/services/chatHistoryService';
import { supabase } from '@/lib/supabase';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { TITLE_CACHE_SIZE } from '@/utils/constants/config';

interface ChatMessage {
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [titleCache, setTitleCache] = useState<any[]>([]); // Cache for ALL titles for fuzzy matching
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false); // Prevent double submission
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

  // Load title cache only (session created on first message)
  useEffect(() => {
    const initializeTitleCache = async () => {
      if (!user?.id || !user?.email) return;

      try {
        // Load title cache for fuzzy matching (recent titles only)
        console.log('📚 Loading title cache for fuzzy matching...');
        const { data: allTitles, error: titlesError } = await supabase
          .from('titles')
          .select('title_id, title_name_en, title_name_kr')
          .order('created_at', { ascending: false })
          .limit(TITLE_CACHE_SIZE);

        if (titlesError) {
          console.error('Error loading title cache:', titlesError);
        } else if (allTitles) {
          setTitleCache(allTitles);
          console.log(`✅ Loaded ${allTitles.length} titles into cache for matching`);
        }

        // Session will be created when user sends first message
        console.log('💬 Ready for chat (session will be created on first message)');
      } catch (error) {
        console.error('Error initializing title cache:', error);
      }
    };

    initializeTitleCache();
  }, [user?.id, user?.email]);

  // Load message history from database
  useEffect(() => {
    const loadHistory = async () => {
      if (!currentSession || hasLoadedHistory) return;

      // Skip if we already have messages for this session (prevents duplicate loads)
      if (messages.length > 0 && !isLoadingHistory) {
        console.log('⏭️ Skipping history load - messages already loaded');
        setHasLoadedHistory(true);
        return;
      }

      setIsLoadingHistory(true);
      try {
        console.log('📂 Loading history for session:', currentSession.id);
        const history = await chatHistoryService.getSessionMessagesWithData(currentSession.id);

        if (history && history.length > 0) {
          console.log('📦 Raw history from database:', history.length, 'messages');

          // Log each message with ID and content
          history.forEach((m: any, idx: number) => {
            console.log(`  ${idx + 1}. ID: ${m.id.substring(0, 8)}... | ${m.sender} | "${m.content.substring(0, 50)}..."`);
          });

          const formattedMessages: ChatMessage[] = history.map((msg: any) => ({
            id: msg.id,
            role: msg.message_type === 'user_prompt' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            titles: msg.titles,
            suggestedQueries: msg.suggestedQueries,
            messageId: msg.id,
          }));

          // Deduplicate messages - keep only unique by content + role
          // This handles legacy duplicates in the database from before the submission lock
          const seenMessages = new Map<string, ChatMessage>();

          for (const msg of formattedMessages) {
            // Create a key from content (first 200 chars) + role to identify duplicates
            const contentKey = `${msg.role}:${msg.content.substring(0, 200).trim()}`;

            if (seenMessages.has(contentKey)) {
              console.log(`🗑️ Skipping duplicate: "${msg.content.substring(0, 50)}..."`);
              continue;
            }

            seenMessages.set(contentKey, msg);
          }

          const deduplicatedMessages = Array.from(seenMessages.values());

          setMessages(deduplicatedMessages);
          console.log(`📜 Loaded ${deduplicatedMessages.length} messages from history (${formattedMessages.length - deduplicatedMessages.length} duplicates filtered)`);
        } else {
          console.log('📭 No history found for this session');
        }

        setHasLoadedHistory(true);
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [currentSession?.id, hasLoadedHistory]);

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || loading || !user?.id) return;

    // Prevent double submission (React StrictMode or rapid clicks)
    if (isSubmittingRef.current) {
      console.log('⏭️ Skipping duplicate submission');
      return;
    }
    isSubmittingRef.current = true;

    try {
      // LAZY SESSION CREATION: Create session if it doesn't exist
      let session = currentSession;
      if (!session) {
        console.log('🆕 Creating new chat session (first message)');
        session = await chatHistoryService.createSession({
          user_id: user.id,
          user_email: user.email!,
          session_type: 'openai',
        });

        if (!session) {
          throw new Error('Failed to create chat session');
        }

        setCurrentSession(session);
        console.log('✅ New session created on first message:', session.id);
      }

      const startTime = Date.now();

      // Add user message to UI immediately
      const tempUserMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date(),
      };

      console.log('💬 Adding user message to UI:', tempUserMessage.id, query);
      setMessages((prev) => [...prev, tempUserMessage]);
      setLoading(true);

      // Record user message in database
      console.log('💾 Recording user message to database...');
      const userDbMessage = await chatHistoryService.recordMessage({
        session_id: session.id,
        user_id: user.id,
        message_type: 'user_prompt',
        content: query,
      });

      if (userDbMessage) {
        console.log('✅ User message recorded with ID:', userDbMessage.id);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempUserMessage.id
              ? { ...msg, id: userDbMessage.id, messageId: userDbMessage.id }
              : msg
          )
        );
      } else {
        console.error('❌ Failed to record user message to database');
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
        session_id: session.id,
        user_id: user.id,
        message_type: 'ai_response',
        content: response.response,
        response_time_ms: responseTime,
      });

      // Record title recommendations if any
      if (botDbMessage && response.titles && response.titles.length > 0) {
        const recommendations = response.titles.map((title: any, index: number) => ({
          message_id: botDbMessage.id,
          session_id: session.id,
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
          session_id: session.id,
          suggested_query: q,
          query_position: index,
        }));

        await chatHistoryService.recordSuggestedQueries(queries);
      }

      // Add bot response to UI
      const botMessage: ChatMessage = {
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
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false; // Reset submission lock
    }
  };

  const handleSuggestedQuery = async (query: string, messageId?: string) => {
    if (!user?.id) return;

    // Mark query as clicked in database (if session exists)
    if (messageId && currentSession) {
      await chatHistoryService.markQueryAsClicked(messageId, query);
    }

    // Track suggestion click (if session exists)
    if (currentSession) {
      await chatHistoryService.recordInteraction({
        session_id: currentSession.id,
        user_id: user.id,
        interaction_type: 'suggestion_click',
        target_title: query,
        metadata: { clicked_at: new Date().toISOString() },
      });
    }

    // Execute the query (will create session if needed)
    await handleSendMessage(query);
  };

  const handleTitleClick = async (titleId: string, titleName: string) => {
    if (!user?.id) return;

    // Track title click (if session exists)
    if (currentSession) {
      await chatHistoryService.recordInteraction({
        session_id: currentSession.id,
        user_id: user.id,
        interaction_type: 'title_click',
        target_id: titleId,
        target_title: titleName,
        metadata: { clicked_at: new Date().toISOString() },
      });
    }

    // Navigate to title detail
    navigate(`/buyers/titles/${titleId}`);
  };

  const handleNewChat = async () => {
    if (!user?.id || !user?.email) return;

    // Clear current session and messages (session created on first message)
    setCurrentSession(null);
    setMessages([]);
    setHasLoadedHistory(false);
    console.log('🆕 New chat started (session will be created on first message)');
  };

  const handleLoadSession = async (session: ChatSession) => {
    if (!session) return;

    try {
      setCurrentSession(session);
      setMessages([]);
      setHasLoadedHistory(false);
      console.log('📂 Loading session:', session.id);

      // Load messages will happen via useEffect when currentSession changes
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat session',
        variant: 'destructive',
      });
    }
  };

  return (
    <BuyerLayout>
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto md:pr-80">
          <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-32 space-y-4 sm:space-y-6">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-[calc(100vh-200px)]">
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
              <div className="space-y-6">
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
                                onQueryClick={(query: string) => handleSuggestedQuery(query, message.messageId)}
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
        </div>

        {/* Fixed Input Area at Bottom with Gradient Fade */}
        <div className="fixed bottom-0 left-0 md:left-64 md:right-80 right-0 bg-gradient-to-t from-white/90 via-white/80 to-transparent backdrop-blur-sm pt-8 pb-6 px-6">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              loading={loading}
              placeholder="Ask me about Korean webtoons, web novels..."
            />
          </div>
        </div>

        {/* Sidebar */}
        {user?.id && (
          <ChatHistorySidebar
            userId={user.id}
            currentSessionId={currentSession?.id || null}
            onLoadSession={handleLoadSession}
            onNewChat={handleNewChat}
          />
        )}
      </div>
    </BuyerLayout>
  );
}
