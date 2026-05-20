import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Icon } from '@iconify/react';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ConversationalMessage } from '@/components/chat/ConversationalMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TitleCard } from '@/components/title/TitleCard';
import { SuggestedQueries } from '@/components/chat/SuggestedQueries';
import ChatHistorySidebar from '@/components/chat/ChatHistorySidebar';
import ChatProcessingStatus from '@/components/chat/ChatProcessingStatus';
import { chatOrchestratorService, ChatPhase, PhaseData, RichExplanation, ChatTiming } from '@/services/chatOrchestratorService';
import { chatHistoryService, type ChatSession } from '@/services/chatHistoryService';
import { supabase } from '@/lib/supabase';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { TITLE_CACHE_SIZE } from '@/utils/constants/config';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { debug } from '@/utils/debug';
import { trackPageView, trackFeatureUsage, trackChatMessage, trackChatSessionStarted, trackChatHistoryLoaded, trackChatMessageSource, trackChatSuggestionClick, trackSessionSearches } from '@/utils/analytics';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  titles?: any[];
  suggestedQueries?: string[];
  explanations?: RichExplanation[]; // AI explanations for title matches
  messageId?: string; // Database message ID for tracking
  isNew?: boolean; // Whether this is a new message (for typewriter effect)
}

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [_historyLoadError, setHistoryLoadError] = useState<string | null>(null); // Used for debugging; toast handles user notification
  const [titleCache, setTitleCache] = useState<any[]>([]); // Cache for ALL titles for fuzzy matching
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // Processing status state for Claude-style status timeline
  const [currentPhase, setCurrentPhase] = useState<ChatPhase>(null);
  const [searchCount, setSearchCount] = useState<number | undefined>(undefined);
  const [progressAfterMessageId, setProgressAfterMessageId] = useState<string | null>(null);
  const [lastTiming, setLastTiming] = useState<ChatTiming | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const submissionLockRef = useRef<Promise<void> | null>(null); // Promise-based lock for session creation
  const hasTriggeredInitialQuery = useRef(false); // Prevent double-triggering URL query
  const promptCountRef = useRef(0); // Track prompts per session for analytics
  const suggestedQueries = chatOrchestratorService.getSuggestedQueries();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Track page view on mount
  useEffect(() => {
    trackPageView('/buyers/chat', 'AI Chat - Jinu');
    trackFeatureUsage('ai_chat');
  }, []);

  // Track session prompts on page leave
  useEffect(() => {
    return () => {
      if (promptCountRef.current > 0) {
        trackSessionSearches('chat', promptCountRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // User change detection - reset chat when user changes
  useEffect(() => {
    if (user?.id) {
      if (previousUserIdRef.current && previousUserIdRef.current !== user.id) {
        debug.log('[UserChange] User changed, resetting chat state');
        setMessages([]);
        setCurrentSession(null);
        setHasLoadedHistory(false);
      }
      previousUserIdRef.current = user.id;
    } else {
      if (previousUserIdRef.current) {
        debug.log('[UserChange] User logged out, clearing chat state');
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
        // Load title cache for fuzzy matching (recent published titles only).
        // Low-priority (priority='3'/null) titles are hidden from the buyer
        // surface, so they must not be matchable in chat either.
        debug.log('📚 Loading title cache for fuzzy matching...');
        const { data: allTitles, error: titlesError } = await supabase
          .from('titles')
          .select('title_id, slug, title_name_en, title_name_kr')
          .in('priority', ['1', '2'])
          .order('created_at', { ascending: false })
          .limit(TITLE_CACHE_SIZE);

        if (titlesError) {
          console.error('Error loading title cache:', titlesError);
        } else if (allTitles) {
          setTitleCache(allTitles);
          debug.log(`✅ Loaded ${allTitles.length} titles into cache for matching`);
        }

        // Session will be created when user sends first message
        debug.log('💬 Ready for chat (session will be created on first message)');
      } catch (error) {
        console.error('Error initializing title cache:', error);
      }
    };

    initializeTitleCache();
  }, [user?.id, user?.email]);

  // Handle URL parameter for initial query (from homepage)
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam && !hasTriggeredInitialQuery.current && user?.id) {
      hasTriggeredInitialQuery.current = true;
      // Auto-submit the query after a short delay to ensure state is ready
      setTimeout(() => {
        handleSendMessage(queryParam, 'url_param');
      }, 100);
    }
  }, [searchParams, user?.id]);

  // Load message history from database
  useEffect(() => {
    const loadHistory = async () => {
      if (!currentSession || hasLoadedHistory) return;

      // Skip if we already have messages for this session (prevents duplicate loads)
      if (messages.length > 0 && !isLoadingHistory) {
        debug.log('⏭️ Skipping history load - messages already loaded');
        setHasLoadedHistory(true);
        return;
      }

      setIsLoadingHistory(true);
      setHistoryLoadError(null);
      try {
        debug.log('📂 Loading history for session:', currentSession.id);
        const history = await chatHistoryService.getSessionMessagesWithData(currentSession.id);

        if (history && history.length > 0) {
          debug.log('📦 Raw history from database:', history.length, 'messages');

          // Log each message with ID and content
          history.forEach((m: any, idx: number) => {
            debug.log(`  ${idx + 1}. ID: ${m.id.substring(0, 8)}... | ${m.sender} | "${m.content.substring(0, 50)}..."`);
          });

          const formattedMessages: ChatMessage[] = history.map((msg: any) => ({
            id: msg.id,
            role: msg.message_type === 'user_prompt' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            // Convert recommendations to titles format for TitleCard
            titles: msg.recommendations?.map((rec: any) => ({
              id: rec.title_id,
              nameEn: rec.title_name_en,
              nameKr: rec.title_name_kr,
              image: rec.titles?.title_image, // From joined titles table
              genre: rec.titles?.genre,
              format: rec.titles?.content_format,
              similarity: rec.recommendation_score,
            })),
            suggestedQueries: msg.suggested_queries, // Fixed: was msg.suggestedQueries
            messageId: msg.id,
          }));

          // Deduplicate messages - keep only unique by content + role
          // This handles legacy duplicates in the database from before the submission lock
          const seenMessages = new Map<string, ChatMessage>();

          for (const msg of formattedMessages) {
            // Create a key from content (first 200 chars) + role to identify duplicates
            const contentKey = `${msg.role}:${msg.content.substring(0, 200).trim()}`;

            if (seenMessages.has(contentKey)) {
              debug.log(`🗑️ Skipping duplicate: "${msg.content.substring(0, 50)}..."`);
              continue;
            }

            seenMessages.set(contentKey, msg);
          }

          const deduplicatedMessages = Array.from(seenMessages.values());

          setMessages(deduplicatedMessages);
          debug.log(`📜 Loaded ${deduplicatedMessages.length} messages from history (${formattedMessages.length - deduplicatedMessages.length} duplicates filtered)`);

          // Track history loaded for analytics
          trackChatHistoryLoaded(currentSession.id, deduplicatedMessages.length);
        } else {
          debug.log('📭 No history found for this session');
        }

        setHasLoadedHistory(true);
      } catch (error) {
        console.error('Error loading chat history:', error);
        setHistoryLoadError('Failed to load chat history. Please try refreshing the page.');
        toast({
          title: 'Error loading history',
          description: 'Could not load your previous messages. You can still start a new conversation.',
          variant: 'destructive',
        });
        // Still mark as loaded to prevent infinite retry loop
        setHasLoadedHistory(true);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [currentSession?.id, hasLoadedHistory]);

  const handleSendMessage = async (
    query: string,
    source: 'typed' | 'example' | 'suggestion' | 'url_param' = 'typed'
  ) => {
    if (!query.trim() || loading || !user?.id) return;

    // Track message source for analytics
    trackChatMessageSource(source, query.length);
    promptCountRef.current += 1;

    // Wait for any pending submission to complete (prevents race condition during session creation)
    if (submissionLockRef.current) {
      debug.log('⏳ Waiting for pending submission to complete...');
      try {
        await submissionLockRef.current;
      } catch {
        // Previous submission failed, continue with this one
      }
    }

    // Create a new lock for this submission
    let resolveLock: () => void;
    let rejectLock: (error: Error) => void;
    submissionLockRef.current = new Promise<void>((resolve, reject) => {
      resolveLock = resolve;
      rejectLock = reject;
    });

    try {
      // LAZY SESSION CREATION: Create session if it doesn't exist
      let session = currentSession;
      if (!session) {
        debug.log('🆕 Creating new chat session (first message)');
        session = await chatHistoryService.createSession({
          user_id: user.id,
          user_email: user.email!,
          session_type: 'openai',
        });

        if (!session) {
          throw new Error('Failed to create chat session');
        }

        setCurrentSession(session);
        debug.log('✅ New session created on first message:', session.id);

        // Track new chat session started
        trackChatSessionStarted(session.id, 'new');
      }

      const startTime = Date.now();

      // Add user message to UI immediately
      const tempUserMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date(),
      };

      debug.log('💬 Adding user message to UI:', tempUserMessage.id, query);
      setMessages((prev) => [...prev, tempUserMessage]);
      setLoading(true);

      // Show "analyzing" phase IMMEDIATELY for instant feedback
      // Progress will appear right after this user message
      setCurrentPhase('analyzing');
      setSearchCount(undefined);
      setProgressAfterMessageId(tempUserMessage.id);

      // Track message sent
      trackChatMessage('sent', query.length);

      // Record user message in database
      debug.log('💾 Recording user message to database...');
      const userDbMessage = await chatHistoryService.recordMessage({
        session_id: session.id,
        user_id: user.id,
        message_type: 'user_prompt',
        content: query,
      });

      if (userDbMessage) {
        debug.log('✅ User message recorded with ID:', userDbMessage.id);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempUserMessage.id
              ? { ...msg, id: userDbMessage.id, messageId: userDbMessage.id }
              : msg
          )
        );
        // Update progress position to use the real message ID
        setProgressAfterMessageId(userDbMessage.id);
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

      // Send to chatbot orchestrator with phase callbacks
      const response = await chatOrchestratorService.sendMessage(
        query,
        conversationHistory,
        user.id,
        {
          onPhaseChange: (phase: ChatPhase, data?: PhaseData) => {
            setCurrentPhase(phase);
            if (data?.count !== undefined) {
              setSearchCount(data.count);
            }
          },
        }
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

      // Add bot response to UI with typewriter effect enabled
      const botMessage: ChatMessage = {
        id: botDbMessage?.id || `temp-bot-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        titles: response.titles,
        suggestedQueries: response.suggestedQueries,
        explanations: response.explanations, // AI explanations for title matches
        messageId: botDbMessage?.id,
        isNew: true, // Enable typewriter effect for new messages
      };

      setMessages((prev) => [...prev, botMessage]);

      // Mark all phases as complete
      setCurrentPhase('complete');

      // Store timing for display
      if (response.timing) {
        setLastTiming(response.timing);
      }

      // Track message received
      trackChatMessage('received', response.response.length, response.titles?.length || 0, responseTime);
    } catch (error: any) {
      console.error('❌ Chat error', error);

      // Track chat error
      trackChatMessage('error');

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

      // Reject the lock so waiting submissions know this one failed
      rejectLock!(error);
    } finally {
      setLoading(false);
      // Progress stays visible until next message is sent
      // Resolve the lock to allow next submission
      resolveLock!();
      submissionLockRef.current = null;
    }
  };

  const handleSuggestedQuery = async (query: string, messageId?: string, position?: number) => {
    if (!user?.id) return;

    // Track suggestion click for GA4 analytics
    trackChatSuggestionClick(query, position || 1);

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
    await handleSendMessage(query, 'suggestion');
  };

  // Note: Title click handling is now managed by TitleCard component directly
  // It uses trackTitleCardClicked for analytics and navigates to title detail page

  const handleNewChat = async () => {
    if (!user?.id || !user?.email) return;

    // Clear current session and messages (session created on first message)
    setCurrentSession(null);
    setMessages([]);
    setHasLoadedHistory(false);
    debug.log('🆕 New chat started (session will be created on first message)');
  };

  const handleLoadSession = async (session: ChatSession) => {
    if (!session) return;

    try {
      setCurrentSession(session);
      setMessages([]);
      setHasLoadedHistory(false);
      debug.log('📂 Loading session:', session.id);

      // Track session resumed from history
      trackChatSessionStarted(session.id, 'resumed');

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
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 mb-40 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* History Button */}
        {user?.id && (
          <div className="flex justify-end">
            <Button
              onClick={() => setShowHistory(true)}
              variant="outline"
              size="sm"
              className="border-gray-300 hover:bg-gray-100"
            >
              <Icon icon="solar:clock-circle-bold-duotone" className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </div>
        )}

        {/* Main Content */}
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="flex flex-col items-center gap-3">
              <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-hanok-teal" />
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
                  <>
                    <ChatMessage message={message} isLatest={index === messages.length - 1} />
                    {/* Processing Status - appears right after the user message that triggered it */}
                    {message.id === progressAfterMessageId && currentPhase && (
                      <div className="ml-11">
                        <ChatProcessingStatus phase={currentPhase} searchCount={searchCount} />
                      </div>
                    )}
                  </>
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
                        titleData={message.titles}
                        allMessages={messages}
                        titleCache={titleCache}
                        enableTypewriter={message.isNew}
                        onTypewriterComplete={() => {
                          // Clear isNew flag after typewriter completes to prevent re-animation
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === message.id ? { ...m, isNew: false } : m
                            )
                          );
                        }}
                      />

                      {/* Suggested Queries - only show after typewriter completes */}
                      {message.suggestedQueries && message.suggestedQueries.length > 0 && !message.isNew && (
                        <div className="mt-4">
                          <SuggestedQueries
                            queries={message.suggestedQueries}
                            onQueryClick={(query: string, position: number) => handleSuggestedQuery(query, message.messageId, position)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Inline Title Cards with Explanations (shown below bot messages - only after typewriter completes) */}
                {message.titles && message.titles.length > 0 && message.role === 'assistant' && !message.isNew && (
                  <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    {message.titles.slice(0, 6).map((title: any, titleIndex: number) => {
                      const explanation = message.explanations?.find(
                        (exp) => exp.title_id === title.id
                      );
                      return (
                        <div key={`${message.id}-title-${title.id || titleIndex}`} className="space-y-2">
                          {/* Static TitleCard - compact variant */}
                          <TitleCard
                            title={title}
                            variant="compact"
                            source="chat"
                            position={titleIndex + 1}
                          />
                          {/* AI Explanation - simple text below card */}
                          {explanation?.explanation_narrative && (
                            <p className="text-sm text-gray-600 pl-2 border-l-2 border-hanok-teal/30">
                              {explanation.explanation_narrative}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed Input Area at Bottom with Gradient Fade */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 pt-8 pb-6 px-6 bg-gradient-to-br from-teal-50/40 via-teal-50/20 to-cyan-50/30">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            loading={loading}
            placeholder="Ask me about Korean webtoons, web novels..."
          />
          {/* Timing breakdown display */}
          {lastTiming && currentPhase === 'complete' && (
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 mt-2">
              <span>Setup: {((lastTiming.setup_ms || 0) / 1000).toFixed(1)}s</span>
              <span className="text-gray-300">→</span>
              <span>Intent: {((lastTiming.intent_ms || 0) / 1000).toFixed(1)}s</span>
              <span className="text-gray-300">→</span>
              <span>Search: {((lastTiming.search_ms || 0) / 1000).toFixed(1)}s</span>
              <span className="text-gray-300">→</span>
              <span>AI: {((lastTiming.ai_ms || 0) / 1000).toFixed(1)}s</span>
              <span className="text-gray-300">→</span>
              <span className="font-medium text-gray-500">Total: {((lastTiming.total_ms || 0) / 1000).toFixed(1)}s</span>
            </div>
          )}
        </div>
      </div>

      {/* History Dialog */}
      {user?.id && (
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-md max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Chat History</DialogTitle>
            </DialogHeader>
            <ChatHistorySidebar
              userId={user.id}
              currentSessionId={currentSession?.id || null}
              onLoadSession={(session) => {
                handleLoadSession(session);
                setShowHistory(false);
              }}
              onNewChat={() => {
                handleNewChat();
                setShowHistory(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </BuyerLayout>
  );
}
