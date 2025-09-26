import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, useToast } from "@kstorybridge/ui";
import { Send, Bot, User, Loader2, ArrowLeft, Sparkles, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { openaiService } from "@/services/openaiService";
import { titlesService } from "@/services/titlesService";
import { chatHistoryService, type ChatSession } from "@/services/chatHistoryService";
import { chatOrchestratorService, type ChatMessage as OrchestratorMessage } from "@/services/chatOrchestratorService";
import { ChatbotFeedback } from "@/components/ChatbotFeedback";
import { TitleFeedback } from "@/components/TitleFeedback";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  titles?: any[];
  suggestedQueries?: string[];
  messageId?: string; // Database message ID for tracking
}

// Simplified conversational message component
const ConversationalMessage = ({ content, navigate, titleData, allMessages, titleCache }: { content: string, navigate: any, titleData?: any[], allMessages?: Message[], titleCache?: any[] }) => {

  // Helper function to find title ID by title name from available title data
  const findTitleIdByName = (titleName: string): string | null => {
    // Clean the title name by normalizing outer quotes and removing trailing punctuation
    const cleanedName = titleName
      .replace(/^["""'']+|["""'']+$/g, '"')  // Normalize only leading/trailing quotes
      .replace(/[.,!?;:]+$/, '')  // Remove only trailing punctuation
      .trim();

    // Debug logging in development
    if (import.meta.env.DEV && titleName.toLowerCase().includes('first love')) {
      console.log('🔍 Title matching debug:', {
        originalTitle: titleName,
        cleanedName,
        messageSpecificTitles: titleData?.length || 0,
        allMessagesCount: allMessages?.length || 0,
        titleCacheSize: titleCache?.length || 0
      });
    }

    // First, try to find in current message's titles (these are most relevant)
    if (titleData && Array.isArray(titleData)) {
      // Try exact match first
      const exactMatch = titleData.find(title => {
        const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
        const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
        return titleEn === cleanedName || titleKr === cleanedName;
      });

      if (exactMatch) return exactMatch.title_id;

      // Try case-insensitive match
      const caseInsensitiveMatch = titleData.find(title => {
        const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
        const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
        const searchName = cleanedName.toLowerCase();
        return titleEn === searchName || titleKr === searchName;
      });

      if (caseInsensitiveMatch) return caseInsensitiveMatch.title_id;
    }

    // Then, search across ALL messages' titles (for cross-references)
    if (allMessages && Array.isArray(allMessages)) {
      const allAvailableTitles: any[] = [];
      allMessages.forEach(msg => {
        if (msg.titles && Array.isArray(msg.titles)) {
          allAvailableTitles.push(...msg.titles);
        }
      });

      // Remove duplicates by title_id
      const uniqueTitles = Array.from(
        new Map(allAvailableTitles.map(item => [item.title_id, item])).values()
      );

      if (uniqueTitles.length > 0) {
        // Try exact match
        const exactMatch = uniqueTitles.find(title => {
          const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
          const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
          return titleEn === cleanedName || titleKr === cleanedName;
        });

        if (exactMatch) return exactMatch.title_id;

        // Try case-insensitive match
        const caseInsensitiveMatch = uniqueTitles.find(title => {
          const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
          const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
          const searchName = cleanedName.toLowerCase();
          return titleEn === searchName || titleKr === searchName;
        });

        if (caseInsensitiveMatch) return caseInsensitiveMatch.title_id;

        // Try partial match (contains) - last resort
        const partialMatch = uniqueTitles.find(title => {
          const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
          const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
          const searchName = cleanedName.toLowerCase();
          return titleEn?.includes(searchName) || titleKr?.includes(searchName);
        });

        if (partialMatch) return partialMatch.title_id;
      }
    }

    // Final fallback: search in title cache (ALL titles from database)
    if (titleCache && titleCache.length > 0) {
      // Only log for actual title searches, not genre names
      if (cleanedName.length > 2 && !['romantasy', 'fantasy', 'romance'].includes(cleanedName.toLowerCase())) {
        console.log('🔍 Searching title cache as fallback:', {
          searchTerm: cleanedName,
          cacheSize: titleCache.length,
          firstFewCacheTitles: titleCache.slice(0, 3).map(t => t.title_name_en || t.title_name_kr)
        });
      }

      // Try exact match in cache
      const exactCacheMatch = titleCache.find(title => {
        const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
        const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
        return titleEn === cleanedName || titleKr === cleanedName;
      });

      if (exactCacheMatch) {
        console.log('✅ Found exact match in title cache:', exactCacheMatch.title_name_en || exactCacheMatch.title_name_kr);
        return exactCacheMatch.title_id;
      }

      // Try case-insensitive match in cache
      const caseInsensitiveCacheMatch = titleCache.find(title => {
        const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
        const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
        const searchName = cleanedName.toLowerCase();
        return titleEn === searchName || titleKr === searchName;
      });

      if (caseInsensitiveCacheMatch) {
        console.log('✅ Found case-insensitive match in title cache:', caseInsensitiveCacheMatch.title_name_en || caseInsensitiveCacheMatch.title_name_kr);
        return caseInsensitiveCacheMatch.title_id;
      }
    }

    // Only log as error if it looks like a real title (not a genre or category)
    const isLikelyTitle = cleanedName.length > 2 &&
                          !['romantasy', 'fantasy', 'romance', 'thriller', 'horror', 'comedy', 'drama', 'action'].includes(cleanedName.toLowerCase());

    if (isLikelyTitle) {
      console.log('⚠️ Title not found in database:', cleanedName, '(AI may have generated a fictional example)');
    }
    return null;
  };
  const formatText = (text: string) => {
    // Split by lines to preserve natural conversation flow
    return text.split('\n').map((line, idx) => {
      // Skip empty lines but preserve spacing
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      // Regular line with title linking
      return (
        <div key={idx} className={idx > 0 ? 'mt-1' : ''}>
          {formatInlineText(line)}
        </div>
      );
    });
  };

  // Helper function to extract English title only and clean formatting
  const extractEnglishTitle = (text: string): string => {
    // Remove Korean text in parentheses, e.g., "Title (한글제목)" -> "Title"
    let cleanedText = text.replace(/\s*\([^)]*[\u3131-\uD79D][^)]*\)/g, '').trim();
    
    // Remove Korean text after slash, e.g., "Title / 한글제목" -> "Title"
    cleanedText = cleanedText.replace(/\s*\/\s*.*[\u3131-\uD79D].*/g, '').trim();
    
    // Remove Korean text after hyphen, e.g., "Title - 한글제목" -> "Title"
    cleanedText = cleanedText.replace(/\s*-\s*.*[\u3131-\uD79D].*/g, '').trim();
    
    // If the whole text starts with Korean, try to find English after separators
    if (/^[\u3131-\uD79D]/.test(cleanedText)) {
      // Try to find English text after common separators
      const matches = text.match(/[A-Za-z][^\/\-\(\)]*[A-Za-z]/g);
      if (matches && matches.length > 0) {
        cleanedText = matches[0].trim();
      }
    }
    
    // Keep asterisks for formatting - they will be handled by formatInlineText
    
    return cleanedText;
  };

  const formatInlineText = (text: string) => {
    // First pass: Find and preserve quoted content (potential titles)
    const quotedSegments: Array<{start: number, end: number, content: string, titleId?: string}> = [];
    const quoteRegex = /"([^"]*)"/g;
    let quoteMatch;

    while ((quoteMatch = quoteRegex.exec(text)) !== null) {
      const quotedContent = quoteMatch[1];
      const foundTitleId = findTitleIdByName(quotedContent);
      quotedSegments.push({
        start: quoteMatch.index,
        end: quoteMatch.index + quoteMatch[0].length,
        content: quotedContent,
        titleId: foundTitleId
      });
    }

    // Second pass: Process the text, avoiding quoted sections for asterisk formatting
    const segments: Array<{type: string, content: string, titleId?: string}> = [];
    let currentIndex = 0;

    // Helper to check if position is within a quoted segment
    const isInQuote = (pos: number) => {
      return quotedSegments.some(q => pos >= q.start && pos < q.end);
    };

    // Process quoted segments and text between them
    const allSegments = [...quotedSegments].sort((a, b) => a.start - b.start);

    allSegments.forEach((quotedSegment, idx) => {
      // Add text before quote (as plain text)
      if (quotedSegment.start > currentIndex) {
        const textBefore = text.slice(currentIndex, quotedSegment.start);
        segments.push(...processText(textBefore));
      }

      // Add the quoted segment
      segments.push({
        type: 'quote',
        content: quotedSegment.content,
        titleId: quotedSegment.titleId
      });

      currentIndex = quotedSegment.end;
    });

    // Add remaining text after last quote
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      segments.push(...processText(remainingText));
    }

    // If no quotes found, just process as plain text
    if (quotedSegments.length === 0 && segments.length === 0) {
      segments.push(...processText(text));
    }

    // Render segments
    return segments.map((segment, segmentIdx) => {
      switch (segment.type) {
        case 'quote':
          if (segment.titleId) {
            return (
              <button
                key={segmentIdx}
                onClick={() => navigate(`/buyers/titles/${segment.titleId}`)}
                className="font-medium text-hanok-teal hover:text-hanok-teal-600 underline hover:no-underline transition-all cursor-pointer"
                title={`View "${segment.content}" details`}
              >
                "{segment.content}"
              </button>
            );
          } else {
            return <span key={segmentIdx} className="font-medium">"{segment.content}"</span>;
          }
        default:
          return segment.content;
      }
    });
  };

  // Helper function to process text (remove all asterisks, just return as clean text)
  const processText = (text: string): Array<{type: string, content: string}> => {
    return [{
      type: 'text',
      content: text.replace(/\*/g, '') // Remove all asterisks
    }];
  };

  const renderTitleCard = (title: any, onTitleCardClick: (title: any) => void) => {
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-4 hover:shadow-md transition-shadow cursor-pointer"
           onClick={() => onTitleCardClick(title)}>
        <div className="flex gap-3">
        {title.title_image ? (
          <div className="w-16 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={title.title_image} 
              alt={title.title_name_en || title.title_name_kr}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-gray-400">No Image</span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h4 className="font-semibold text-sm text-gray-800 line-clamp-2">
              {title.title_name_en || title.title_name_kr}
            </h4>
            {title.pitch && title.pitch.trim() && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 text-white" style={{backgroundColor: '#FF6B6B'}}>
                Pitch
              </span>
            )}
          </div>
          
          {title.title_name_en && title.title_name_kr && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-1">
              {title.title_name_kr}
            </p>
          )}
          
          <div className="flex flex-wrap gap-1 mb-2">
            {title.genre && (
              Array.isArray(title.genre) ? (
                title.genre.slice(0, 2).map((g: string, idx: number) => (
                  <span key={idx} className="inline-block bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-xs">
                    {g.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                ))
              ) : (
                <span className="inline-block bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-xs">
                  {title.genre.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              )
            )}
            {title.tone && (
              <span className="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">
                {title.tone}
              </span>
            )}
          </div>
          
          {title.synopsis && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {title.synopsis}
            </p>
          )}
        </div>
      </div>
    </div>
    );
  };

  return <div className="prose prose-sm max-w-none">{formatText(content)}</div>;
};

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [useOrchestrator, setUseOrchestrator] = useState(false); // Feature flag - default to legacy mode
  const [titleCache, setTitleCache] = useState<any[]>([]); // Cache for ALL titles for matching
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is authorized - allow all buyers
  const accountType = user?.user_metadata?.account_type || 'buyer';
  const isAuthorized = accountType === 'buyer';

  // Function to get messages to display (truncated or full)
  const getDisplayMessages = () => {
    if (showAllMessages || messages.length <= 5) {
      return messages;
    }
    
    // Show greeting + last 4 messages (2 conversations: user->bot, user->bot)
    const greeting = messages.find(msg =>
      msg.sender === 'bot' && msg.content.includes('Hey there! 👋 I\'m Jinu')
    );
    
    const lastFourMessages = messages.slice(-4);
    
    if (greeting && !lastFourMessages.includes(greeting)) {
      return [greeting, ...lastFourMessages];
    }
    
    return lastFourMessages;
  };

  // Calculate how many messages are hidden
  const getHiddenMessagesCount = () => {
    if (showAllMessages || messages.length <= 5) {
      return 0;
    }
    
    const greeting = messages.find(msg =>
      msg.sender === 'bot' && msg.content.includes('Hey there! 👋 I\'m Jinu')
    );
    
    const visibleCount = greeting ? 5 : 4; // greeting + 4 recent, or just 4 recent
    return Math.max(0, messages.length - visibleCount);
  };
  
  // Debug logging removed to prevent console alerts

  useEffect(() => {
    if (!isAuthorized) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the Chat.",
        variant: "destructive",
      });
      navigate("/profile");
      setIsLoadingHistory(false);
      return;
    }

    if (!user) {
      setIsLoadingHistory(false);
      return;
    }

    // Prevent re-initialization if we already have a session and messages
    if (currentSession && messages.length > 0) {
      setIsLoadingHistory(false);
      // Session already initialized, skipping initialization
      return;
    }

    // Initialize chat session and load history
    const initializeSession = async () => {
      if (!user) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        setIsLoadingHistory(true);
        
        // Add timeout to prevent hanging forever
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Initialization timeout')), 10000); // 10 second timeout
        });
        
        // Check for existing active session or create new one
        const sessionPromise = chatHistoryService.getActiveSession(user.id, 'openai');
        let session = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (!session) {
          const createSessionPromise = chatHistoryService.createSession({
            user_id: user.id,
            user_email: user.email || '',
            session_type: 'openai'
          });
          session = await Promise.race([createSessionPromise, timeoutPromise]) as any;
        }

        if (session) {
          setCurrentSession(session);
          // Chat session initialized
          
          // Load conversation history with related data from this session
          const historyPromise = chatHistoryService.getSessionMessagesWithData(session.id);
          const history = await Promise.race([historyPromise, timeoutPromise]) as any;
          
          if (history && history.length > 0) {
            // Messages are already enhanced with titles and suggestedQueries
            const restoredMessages: Message[] = history;
            
            // Add greeting message at the beginning if not already there
            const hasGreeting = restoredMessages.some(msg =>
              msg.sender === 'bot' && msg.content.includes('Hey there! 👋 I\'m Jinu')
            );
            
            if (!hasGreeting) {
              restoredMessages.unshift({
                id: 'greeting',
                content: `Hey there! 👋 I'm Jinu, and I'm absolutely obsessed with Korean content! I spend my days discovering amazing stories in our KStoryBridge collection, and I love nothing more than helping fellow enthusiasts find their next favorite read or watch.

I'm really excited to chat with you about Korean entertainment! Whether you're into intense psychological thrillers, heartwarming slice-of-life stories, epic fantasy adventures, or anything in between - I've got some incredible recommendations from our collection.

What's been catching your interest lately? Are you looking for something specific, or are you in the mood to discover something completely new? I love hearing about what draws people to different stories!`,
                sender: 'bot',
                timestamp: new Date(session.created_at),
              });
            }
            
            setMessages(restoredMessages);
            // Loaded messages from session history
          } else {
            // No history, show initial greeting
            setMessages([
              {
                id: Date.now().toString(),
                content: `Hey there! 👋 I'm Jinu, and I'm absolutely obsessed with Korean content! I spend my days discovering amazing stories in our KStoryBridge collection, and I love nothing more than helping fellow enthusiasts find their next favorite read or watch.

I'm really excited to chat with you about Korean entertainment! Whether you're into intense psychological thrillers, heartwarming slice-of-life stories, epic fantasy adventures, or anything in between - I've got some incredible recommendations from our collection.

What's been catching your interest lately? Are you looking for something specific, or are you in the mood to discover something completely new? I love hearing about what draws people to different stories!`,
                sender: 'bot',
                timestamp: new Date(),
              }
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat session:', error);
        
        // Show toast notification for debugging
        toast({
          title: "Chat Initialization",
          description: `Failed to load chat history: ${error.message}. Starting fresh session.`,
          variant: "default"
        });
        
        // Still show greeting message even if session fails
        setMessages([
          {
            id: Date.now().toString(),
            content: `Hey there! 👋 I'm Jinu, and I'm absolutely obsessed with Korean content! I spend my days discovering amazing stories in our KStoryBridge collection, and I love nothing more than helping fellow enthusiasts find their next favorite read or watch.

I'm really excited to chat with you about Korean entertainment! Whether you're into intense psychological thrillers, heartwarming slice-of-life stories, epic fantasy adventures, or anything in between - I've got some incredible recommendations from our collection.

What's been catching your interest lately? Are you looking for something specific, or are you in the mood to discover something completely new? I love hearing about what draws people to different stories!`,
            sender: 'bot',
            timestamp: new Date(),
          }
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    initializeSession();

    // Don't end session on unmount - keep it active for the user's session
    // Sessions will be managed by activity timeout or explicit logout
  }, [isAuthorized, user?.id]); // Reduced dependencies - only re-run when user changes or authorization status changes

  // Load title cache for better title matching
  useEffect(() => {
    const loadTitleCache = async () => {
      if (!user) return;

      try {
        console.log('📚 Loading title cache for improved matching...');
        const { data: allTitles, error } = await supabase
          .from('titles')
          .select('title_id, title_name_en, title_name_kr')
          .limit(1000); // Increased limit to get more titles

        if (!error && allTitles) {
          setTitleCache(allTitles);
          console.log('✅ Title cache loaded:', {
            count: allTitles.length,
            sampleTitles: allTitles.slice(0, 5).map(t => t.title_name_en || t.title_name_kr),
            hasAIInLove: allTitles.some(t =>
              t.title_name_en?.toLowerCase().includes('ai') ||
              t.title_name_kr?.toLowerCase().includes('ai')
            )
          });
        } else {
          console.error('❌ Failed to load title cache:', error);
        }
      } catch (error) {
        console.error('❌ Exception loading title cache:', error);
      }
    };

    loadTitleCache();
  }, [user]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'bot') {
      // Messages state updated
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    console.log('🔄 handleSendMessage called:', {
      hasInput: !!inputMessage.trim(),
      isLoading,
      isProcessingMessage,
      hasSession: !!currentSession,
      hasUser: !!user,
      useOrchestrator,
      inputMessage: inputMessage.substring(0, 50) + '...'
    });

    if (!inputMessage.trim() || isLoading || isProcessingMessage || isStreaming || !user) {
      console.log('❌ handleSendMessage early return:', {
        noInput: !inputMessage.trim(),
        isLoading,
        isProcessingMessage,
        isStreaming,
        noUser: !user
      });
      return;
    }

    // Set processing flag to prevent duplicate submissions
    setIsProcessingMessage(true);

    // Capture message content immediately and clear input to prevent duplicates
    const messageContent = inputMessage.trim();
    setInputMessage("");

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Reset to truncated view when starting new conversation
    if (showAllMessages) {
      setShowAllMessages(false);
    }

    const startTime = Date.now();

    try {
      if (useOrchestrator) {
        console.log('🎯 Using Enhanced Mode (Pro Feature - OpenAI GPT-4 via Orchestrator)', {
          model: 'gpt-4-turbo-preview',
          provider: 'OpenAI',
          mode: 'Enhanced (Pro)',
          query: messageContent.substring(0, 50) + '...',
          user: user?.email
        });
        // Use new orchestrator service with streaming
        await handleOrchestratorMessage(messageContent, userMessage, startTime);
      } else {
        console.log('🎯 Using Standard Mode (OpenAI Direct)', {
          model: 'gpt-4-turbo',
          provider: 'OpenAI',
          mode: 'Standard',
          query: messageContent.substring(0, 50) + '...',
          user: user?.email
        });
        // Fallback to existing OpenAI service
        await handleLegacyMessage(messageContent, userMessage, startTime);
      }
    } catch (error: any) {
      console.error("🚨 CHAT ERROR:", {
        system: useOrchestrator ? 'Chat Orchestrator' : 'OpenAI Direct',
        error: error.message,
        user: user?.email,
        query: messageContent
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I encountered an error: ${error.message}

Please try again or switch to the legacy chat mode if the issue persists.`,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Chat Error",
        description: error.message || "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsProcessingMessage(false);
      setIsStreaming(false);
      setStreamingResponse('');
    }
  };

  const handleOrchestratorMessage = async (messageContent: string, userMessage: Message, startTime: number) => {
    console.log('🚀 Starting orchestrator message handling:', {
      messageContent: messageContent.substring(0, 50) + '...',
      hasSession: !!currentSession,
      sessionId: currentSession?.id
    });

    setIsStreaming(true);
    setStreamingResponse('');

    // Convert message history to orchestrator format
    const conversationHistory = chatOrchestratorService.formatConversationHistory([...messages, userMessage]);

    console.log('📋 Conversation history prepared:', {
      historyLength: conversationHistory.length,
      lastMessage: conversationHistory[conversationHistory.length - 1]
    });

    // Create a placeholder bot message for streaming
    const streamingBotMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'bot',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, streamingBotMessage]);

    await chatOrchestratorService.sendMessageStream(conversationHistory, {
      sessionId: currentSession?.id,
      onChunk: (text: string) => {
        setStreamingResponse(prev => prev + text);
        // Update the bot message in real-time
        setMessages(prev => {
          return prev.map(msg =>
            msg.id === streamingBotMessage.id
              ? { ...msg, content: (msg.content || '') + text }
              : msg
          );
        });
      },
      onComplete: (fullResponse: string) => {
        console.log('✅ Orchestrator streaming completed:', {
          responseLength: fullResponse.length,
          responseTime: Date.now() - startTime
        });

        // Final update with complete response
        setMessages(prev => {
          return prev.map(msg =>
            msg.id === streamingBotMessage.id
              ? { ...msg, content: fullResponse }
              : msg
          );
        });

        setIsStreaming(false);
        setStreamingResponse('');
      },
      onError: (error: string) => {
        console.error('❌ Orchestrator streaming error:', error);

        // Update message with error
        setMessages(prev => {
          return prev.map(msg =>
            msg.id === streamingBotMessage.id
              ? {
                  ...msg,
                  content: `I apologize, but I encountered an error: ${error}\n\nPlease try again or switch to legacy mode.`
                }
              : msg
          );
        });

        setIsStreaming(false);
        setStreamingResponse('');
        throw new Error(error);
      }
    });
  };

  const handleLegacyMessage = async (messageContent: string, userMessage: Message, startTime: number) => {
    setIsLoading(true);

    // Record user message in database (if session available)
    let userDbMessage = null;
    if (currentSession) {
      try {
        userDbMessage = await chatHistoryService.recordMessage({
          session_id: currentSession.id,
          user_id: user.id,
          message_type: 'user_prompt',
          content: userMessage.content,
        });

        if (userDbMessage) {
          userMessage.messageId = userDbMessage.id;
        }
      } catch (error) {
        console.warn('Failed to record user message:', error);
      }
    }

    // Get conversation history for context
    const conversationHistory = messages.slice(-6).map(msg =>
      `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    );

    const response = await openaiService.generateChatResponse(
      userMessage.content,
      conversationHistory,
      user?.id,
      currentSession?.id
    );

    const responseTime = Date.now() - startTime;

    // Create bot message
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: response.message,
      sender: 'bot',
      timestamp: new Date(),
      titles: response.recommendedTitles ? [...response.recommendedTitles] : undefined,
      suggestedQueries: response.suggestedQueries ? [...response.suggestedQueries] : undefined
    };

    // Record AI response in database (if session available)
    let botDbMessage = null;
    if (currentSession) {
      try {
        botDbMessage = await chatHistoryService.recordMessage({
          session_id: currentSession.id,
          user_id: user.id,
          message_type: 'ai_response',
          content: response.message,
          tokens_used: 0,
          response_time_ms: responseTime,
        });

        if (botDbMessage) {
          botMessage.messageId = botDbMessage.id;

          // Record title recommendations and suggested queries
          if (response.recommendedTitles?.length) {
            const recommendations = response.recommendedTitles.map(title => ({
              message_id: botDbMessage.id,
              session_id: currentSession.id,
              title_id: title.title_id,
              title_name_en: title.title_name_en,
              title_name_kr: title.title_name_kr,
              recommendation_score: title.score || 0,
              recommendation_reason: `AI recommended based on user query: "${userMessage.content}"`,
            }));

            await chatHistoryService.recordRecommendations(recommendations);
          }

          if (response.suggestedQueries?.length) {
            const suggestedQueries = response.suggestedQueries.map((query, index) => ({
              message_id: botDbMessage.id,
              session_id: currentSession.id,
              suggested_query: query,
              query_position: index,
            }));

            await chatHistoryService.recordSuggestedQueries(suggestedQueries);
          }
        }
      } catch (error) {
        console.warn('Failed to record AI response:', error);
      }
    }

    setMessages(prev => [...prev, botMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleSuggestedQuery = async (query: string, messageId?: string) => {
    setInputMessage(query);

    // Record suggestion click
    if (currentSession && user) {
      await chatHistoryService.recordInteraction({
        session_id: currentSession.id,
        user_id: user.id,
        interaction_type: 'suggestion_click',
        target_id: query,
        target_title: query,
        metadata: { 
          clicked_query: query,
          source_message_id: messageId,
          timestamp: new Date().toISOString()
        }
      });

      // Mark the suggested query as clicked in database
      if (messageId) {
        await chatHistoryService.markQueryAsClicked(messageId, query);
      }
    }
  };


  const formatTitleCard = (title: any, messageId?: string, userPrompt?: string) => {
    const handleTitleCardClick = async () => {
      // Record title view interaction
      if (currentSession && user) {
        await chatHistoryService.recordInteraction({
          session_id: currentSession.id,
          user_id: user.id,
          interaction_type: 'title_view',
          target_id: title.title_id,
          target_title: title.title_name_en || title.title_name_kr || 'Unknown Title',
          metadata: {
            source: 'recommended_titles_card',
            title_name_en: title.title_name_en,
            title_name_kr: title.title_name_kr,
            recommendation_score: title.score,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      navigate(`/buyers/titles/${title.title_id}`);
    };

    return (
      <div key={title.title_id} className="bg-white rounded-lg border border-gray-300 p-4 hover:shadow-md transition-shadow group relative">
        <div className="flex gap-3" onClick={handleTitleCardClick} style={{cursor: 'pointer'}}>
          {title.title_image ? (
            <div className="w-16 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={title.title_image} 
                alt={title.title_name_en || title.title_name_kr}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-gray-400">No Image</span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-start gap-2">
                <h4 className="font-semibold text-sm text-gray-800 line-clamp-2">
                  {title.title_name_en || title.title_name_kr}
                </h4>
                {title.pitch && title.pitch.trim() && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 text-white" style={{backgroundColor: '#FF6B6B'}}>
                    Pitch
                  </span>
                )}
              </div>
              
              {/* Per-Title Feedback Component */}
              {messageId && userPrompt && (
                <div onClick={(e) => e.stopPropagation()}>
                  <TitleFeedback
                    title={title}
                    messageId={messageId}
                    userPrompt={userPrompt}
                    onFeedbackSubmitted={() => {
                      // Title feedback submitted
                    }}
                  />
                </div>
              )}
            </div>
            
            {title.title_name_en && title.title_name_kr && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                {title.title_name_kr}
              </p>
            )}
            
            <div className="flex flex-wrap gap-1 mb-2">
              {title.genre && (
                Array.isArray(title.genre) ? (
                  title.genre.slice(0, 2).map((g: string, idx: number) => (
                    <span key={idx} className="inline-block bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-xs">
                      {g.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                  ))
                ) : (
                  <span className="inline-block bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-xs">
                    {title.genre.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                )
              )}
              {title.tone && (
                <span className="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">
                  {title.tone}
                </span>
              )}
            </div>
            
            {title.synopsis && (
              <p className="text-xs text-gray-600 line-clamp-2">
                {title.synopsis}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="fixed inset-0 lg:left-72 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-midnight-ink leading-tight">
                  AI ASSISTANT
                </h2>
                <span className="px-2 py-1 text-xs font-bold text-white rounded-full uppercase"
                      style={{ backgroundColor: '#FF6B6B' }}>
                  BETA
                </span>
                {useOrchestrator && (
                  <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-full uppercase">
                    Enhanced
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* New Chat Button */}
              <Button
                onClick={() => {
                  setMessages([{
                    id: 'greeting',
                    content: `Hey there! 👋 I'm Jinu, and I'm absolutely obsessed with Korean content! I spend my days discovering amazing stories in our KStoryBridge collection, and I love nothing more than helping fellow enthusiasts find their next favorite read or watch.

I'm really excited to chat with you about Korean entertainment! Whether you're into intense psychological thrillers, heartwarming slice-of-life stories, epic fantasy adventures, or anything in between - I've got some incredible recommendations from our collection.

What's been catching your interest lately? Are you looking for something specific, or are you in the mood to discover something completely new? I love hearing about what draws people to different stories!`,
                    sender: 'bot',
                    timestamp: new Date(),
                  }]);
                  setInputMessage('');
                }}
                variant="outline"
                className="hidden sm:flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Container - Clean, no card wrapper */}
        <div className="flex-1 flex flex-col overflow-hidden px-3 sm:px-6 lg:px-8">
          {/* Messages Container - Clean ChatGPT style */}
          <div className="flex-1 overflow-y-auto py-4 space-y-6 pb-40">
            {/* Loading History Indicator */}
            {isLoadingHistory && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading conversation history...</span>
                </div>
              </div>
            )}
            
            {!isLoadingHistory && messages.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500 text-sm">Start a conversation to discover Korean content!</p>
              </div>
            )}
            
            {/* Show older messages button if messages are truncated */}
            {!isLoadingHistory && getHiddenMessagesCount() > 0 && !showAllMessages && (
              <div className="flex justify-center py-4">
                <button
                  onClick={() => setShowAllMessages(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition-colors"
                >
                  <span>Show {getHiddenMessagesCount()} older messages</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>
            )}
            
            {!isLoadingHistory &&
            getDisplayMessages().map((message, index, messagesArray) => (
              <div key={message.id} className="group">
                <div className={`flex gap-4 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Simple Avatar Icon */}
                  <div className="flex-shrink-0 pt-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      message.sender === 'user'
                        ? 'bg-gray-700'
                        : 'bg-gradient-to-br from-green-600 to-green-700'
                    }`}>
                      {message.sender === 'user' ? (
                        <User size={14} className="text-white" />
                      ) : (
                        <Sparkles size={14} className="text-white" />
                      )}
                    </div>
                  </div>

                  {/* Message Content - Clean and Simple */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        {message.sender === 'user' ? 'You' : 'Jinu'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`prose prose-sm max-w-none ${
                      message.sender === 'user' ? 'text-gray-700' : 'text-gray-800'
                    }`}>
                      <ConversationalMessage content={message.content} navigate={navigate} titleData={message.titles} allMessages={messages} titleCache={titleCache} />
                    </div>
                    
                    {/* Suggested Queries - Cleaner display */}
                    {message.suggestedQueries && message.suggestedQueries.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500">Try:</span>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestedQueries.map((query, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestedQuery(query, message.messageId)}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors"
                            >
                              {query}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback Component for Bot Messages - Disabled in favor of per-title feedback */}
                    {false && message.sender === 'bot' && message.messageId && !message.content.includes('Hey there! 👋 I\'m Jinu') && (() => {
                      // Find the preceding user message for context
                      const userMessage = messagesArray.slice(0, index).reverse().find(m => m.sender === 'user');
                      return (
                        <ChatbotFeedback
                          messageId={message.messageId}
                          userPrompt={userMessage?.content || "User query"}
                          aiResponse={message.content}
                          recommendedTitles={message.titles || []}
                          onFeedbackSubmitted={() => {
                            // Feedback submitted for message
                          }}
                        />
                      );
                    })()}

                  </div>
                </div>
              </div>
            ))}

            {/* Loading Message - Only for non-streaming operations */}
            {isLoading && !isStreaming && (
              <div className="group">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                      <Sparkles size={14} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">Jinu</span>
                      <span className="text-xs text-gray-400">is typing</span>
                      {useOrchestrator && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                          Enhanced
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show collapse button if all messages are shown and there are hidden messages */}
            {!isLoadingHistory && showAllMessages && messages.length > 5 && (
              <div className="flex justify-center py-4">
                <button
                  onClick={() => setShowAllMessages(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition-colors"
                >
                  <span>Show recent messages only</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

        </div>
      </div>

      {/* Fixed ChatGPT-style Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
              <div className="flex items-end gap-2 p-3">
                <textarea
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Send a message..."
                  className="flex-1 max-h-32 px-4 py-3 resize-none focus:outline-none text-sm placeholder-gray-400"
                  rows={1}
                  disabled={isLoading || isLoadingHistory || isProcessingMessage}
                  style={{
                    minHeight: '44px',
                    overflowY: 'hidden'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading || isLoadingHistory || isProcessingMessage || isStreaming}
                  className={`p-2 rounded-lg transition-colors ${
                    inputMessage.trim() && !isLoading && !isLoadingHistory && !isProcessingMessage && !isStreaming
                      ? 'bg-gray-700 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="px-7 pb-2 text-xs text-gray-400 flex justify-between items-center">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <div className="flex items-center gap-2">
                  {/* Mode Toggle Switch */}
                  <button
                    onClick={() => {
                      const newMode = !useOrchestrator;
                      console.log('🎛️ Chat Mode Toggle', {
                        from: useOrchestrator ? 'Enhanced (OpenAI GPT-4)' : 'Standard (OpenAI Direct)',
                        to: newMode ? 'Enhanced (OpenAI GPT-4)' : 'Standard (OpenAI Direct)',
                        timestamp: new Date().toISOString()
                      });
                      setUseOrchestrator(newMode);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                    title={useOrchestrator ? "Switch to Standard Mode" : "Switch to Enhanced Mode (Pro Users Only)"}
                  >
                    {useOrchestrator ? (
                      <>
                        <Sparkles size={12} className="text-blue-600" />
                        <span className="text-gray-700 font-medium">Enhanced Mode</span>
                        <span className="text-blue-600 text-xs">(Pro)</span>
                      </>
                    ) : (
                      <>
                        <Bot size={12} className="text-gray-600" />
                        <span className="text-gray-700 font-medium">Standard Mode</span>
                      </>
                    )}
                    <svg className="w-3 h-3 text-gray-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>

                  {isStreaming && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Streaming
                    </span>
                  )}
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}