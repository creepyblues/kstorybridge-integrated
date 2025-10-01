import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@kstorybridge/ui";
import { useToast } from "@/hooks/use-toast";import { Send, Bot, User, Loader2, ArrowLeft, Sparkles, Brain, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { openaiService } from "@/services/openaiService";
import { titlesService } from "@/services/titlesService";
import { chatHistoryService, type ChatSession } from "@/services/chatHistoryService";
import { chatOrchestratorService, type ChatMessage as OrchestratorMessage } from "@/services/chatOrchestratorService";
import { ChatbotFeedback } from "@/components/ChatbotFeedback";
import { TitleFeedback } from "@/components/TitleFeedback";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { ChatEmptyState } from "@/components/ChatEmptyState";
import ProBadge from "@/components/ProBadge";
import { useTierAccess } from "@/hooks/useTierAccess";
import PremiumFeaturePopup from "@/components/PremiumFeaturePopup";
import { ChatUpgradePrompt } from "@/components/UpgradePrompt";
import { trackSearch, trackTitleView, trackAdvancedChatUsage, trackEvent, trackTitleCardClick } from "@/utils/analytics";

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
    // Clean the title name by extracting from markdown links and normalizing
    const cleanedName = titleName
      .replace(/^\[([^\]]+)\]\([^)]*\)$/, '$1')  // Extract title from [title](url) markdown links
      .replace(/^["""'']+|["""'']+$/g, '"')     // Normalize only leading/trailing quotes
      .replace(/[.,!?;:]+$/, '')                // Remove only trailing punctuation
      .trim();

    // Debug logging in development for markdown links and specific cases
    if (import.meta.env.DEV && (titleName.includes('[') || titleName.toLowerCase().includes('first love'))) {
      console.log('🔍 Title matching debug:', {
        originalTitle: titleName,
        cleanedName,
        wasMarkdownLink: titleName.includes('[') && titleName.includes(']('),
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

    // Second pass: Find unquoted title names (fallback pattern matching)
    // Look for capitalized phrases that might be titles
    const unquotedTitleSegments: Array<{start: number, end: number, content: string, titleId?: string}> = [];

    // Only search if we have titleData or titleCache to match against
    if ((titleData && titleData.length > 0) || (titleCache && titleCache.length > 0)) {
      // Build a list of all available title names (both English and Korean)
      const availableTitles: Array<{name: string, titleId: string}> = [];

      // Add titles from titleData
      if (titleData) {
        titleData.forEach(title => {
          if (title.title_name_en) availableTitles.push({ name: title.title_name_en, titleId: title.title_id });
          if (title.title_name_kr) availableTitles.push({ name: title.title_name_kr, titleId: title.title_id });
        });
      }

      // Add titles from titleCache
      if (titleCache) {
        titleCache.forEach(title => {
          if (title.title_name_en) availableTitles.push({ name: title.title_name_en, titleId: title.title_id });
          if (title.title_name_kr) availableTitles.push({ name: title.title_name_kr, titleId: title.title_id });
        });
      }

      // Remove duplicates
      const uniqueTitles = Array.from(
        new Map(availableTitles.map(item => [item.name, item])).values()
      );

      // Sort by length (longest first) to match multi-word titles before single words
      uniqueTitles.sort((a, b) => b.name.length - a.name.length);

      // Search for each title name in the text (case-insensitive)
      uniqueTitles.forEach(titleInfo => {
        const titleName = titleInfo.name;
        const regex = new RegExp(`\\b${titleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        let match;

        while ((match = regex.exec(text)) !== null) {
          const matchStart = match.index;
          const matchEnd = matchStart + match[0].length;

          // Check if this position is already inside a quoted segment
          const isInsideQuote = quotedSegments.some(seg =>
            matchStart >= seg.start && matchEnd <= seg.end
          );

          // Check if this position overlaps with another unquoted segment
          const overlapsExisting = unquotedTitleSegments.some(seg =>
            (matchStart >= seg.start && matchStart < seg.end) ||
            (matchEnd > seg.start && matchEnd <= seg.end)
          );

          if (!isInsideQuote && !overlapsExisting) {
            unquotedTitleSegments.push({
              start: matchStart,
              end: matchEnd,
              content: match[0], // Use the actual matched text (preserves case)
              titleId: titleInfo.titleId
            });
          }
        }
      });
    }

    // Third pass: Process the text with all segments (quoted + unquoted titles)
    const segments: Array<{type: string, content: string, titleId?: string}> = [];
    let currentIndex = 0;

    // Combine and sort all segments (quoted and unquoted titles)
    const allSegments = [...quotedSegments, ...unquotedTitleSegments].sort((a, b) => a.start - b.start);

    allSegments.forEach((segment) => {
      // Add text before this segment (as plain text)
      if (segment.start > currentIndex) {
        const textBefore = text.slice(currentIndex, segment.start);
        segments.push(...processText(textBefore));
      }

      // Determine segment type
      const isQuoted = quotedSegments.includes(segment);
      const segmentType = isQuoted ? 'quote' : 'unquoted-title';

      // Add the segment
      segments.push({
        type: segmentType,
        content: segment.content,
        titleId: segment.titleId
      });

      currentIndex = segment.end;
    });

    // Add remaining text after last segment
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      segments.push(...processText(remainingText));
    }

    // If no segments found, just process as plain text
    if (allSegments.length === 0 && segments.length === 0) {
      segments.push(...processText(text));
    }

    // Render segments
    return segments.map((segment, segmentIdx) => {
      switch (segment.type) {
        case 'quote':
          if (segment.titleId) {
            return (
              <a
                key={segmentIdx}
                href={`/buyers/titles/${segment.titleId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-hanok-teal hover:text-hanok-teal-600 underline hover:no-underline transition-all cursor-pointer"
                title={`View "${segment.content}" details`}
              >
                "{segment.content}"
              </a>
            );
          } else {
            return <span key={segmentIdx} className="font-medium">"{segment.content}"</span>;
          }
        case 'unquoted-title':
          if (segment.titleId) {
            return (
              <a
                key={segmentIdx}
                href={`/buyers/titles/${segment.titleId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-hanok-teal hover:text-hanok-teal-600 underline hover:no-underline transition-all cursor-pointer"
                title={`View "${segment.content}" details`}
              >
                {segment.content}
              </a>
            );
          } else {
            return <span key={segmentIdx} className="font-medium">{segment.content}</span>;
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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // Changed to false - no loading on mount
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [useOrchestrator, setUseOrchestrator] = useState(false); // Feature flag - default to legacy mode
  const [titleCache, setTitleCache] = useState<any[]>([]); // Cache for ALL titles for matching
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // Toggle between current chat and full history
  const [premiumPopupOpen, setPremiumPopupOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousUserIdRef = useRef<string | null>(null); // Track user changes

  // Tier access for Advanced mode restriction
  const { hasMinimumTier } = useTierAccess();

  // User change detection - reset chat when user changes (logout/login with different account)
  useEffect(() => {
    if (user?.id) {
      // If user ID changed (different user logged in), reset all state
      if (previousUserIdRef.current && previousUserIdRef.current !== user.id) {
        console.log('[UserChange] User changed, resetting chat state');
        setMessages([]);
        setCurrentSession(null);
        setHasStartedConversation(false);
        setShowHistory(false);
        setInputMessage('');
      }

      // Update the previous user ID
      previousUserIdRef.current = user.id;
    } else {
      // User logged out, clear state
      if (previousUserIdRef.current) {
        console.log('[UserChange] User logged out, clearing chat state');
        setMessages([]);
        setCurrentSession(null);
        setHasStartedConversation(false);
        setShowHistory(false);
        setInputMessage('');
        previousUserIdRef.current = null;
      }
    }
  }, [user?.id]);

  // Check if user is authorized - allow all buyers
  const { accountType, loading: accountTypeLoading } = useAccountType();
  const isAuthorized = accountType === 'buyer';

  // Determine if we should show empty state - always show on page load until user sends first message or views history
  const shouldShowEmptyState = !hasStartedConversation && !isLoadingHistory && !showHistory;

  // Function to get messages to display (truncated or full)
  const getDisplayMessages = () => {
    // Only show all messages if explicitly requested, not just for history view
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
    // Wait for account type loading to complete before checking authorization
    if (accountTypeLoading) {
      return;
    }

    if (!isAuthorized) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the Chat.",
        variant: "destructive",
      });
      navigate("/signin");
      return;
    }

    // No history loading on mount - will load lazily when user sends first message
  }, [isAuthorized, accountTypeLoading, user?.id]);

  // REMOVED: Old navigation-based onboarding trigger (replaced with context)

  // Load history when user clicks "Go back to Chat history"
  useEffect(() => {
    const loadHistoryWhenRequested = async () => {
      if (showHistory && messages.length === 0 && user && !currentSession) {
        // User wants to see history but no messages loaded yet
        await ensureSessionAndLoadHistory();
      }
    };

    loadHistoryWhenRequested();
  }, [showHistory, user]);

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

  // Lazy load session and history when user sends first message
  const ensureSessionAndLoadHistory = async () => {
    if (!user) return null;

    // If we already have a session, return it
    if (currentSession) {
      return currentSession;
    }

    try {
      setIsLoadingHistory(true);

      // Check for existing active session or create new one
      let session = await chatHistoryService.getActiveSession(user.id, 'openai');

      if (!session) {
        session = await chatHistoryService.createSession({
          user_id: user.id,
          user_email: user.email || '',
          session_type: 'openai'
        });
      }

      if (session) {
        setCurrentSession(session);

        // Load conversation history
        const history = await chatHistoryService.getSessionMessagesWithData(session.id);

        if (history && history.length > 0) {
          // Prepend history to messages (before the user's current message)
          setMessages(prev => [...history, ...prev]);
        }
      }

      return session;
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
      return null;
    } finally {
      setIsLoadingHistory(false);
    }
  };


  const handleEmptyStateMessage = async (message: string) => {
    if (!message.trim() || isLoading || isProcessingMessage || isStreaming || !user) {
      return;
    }

    // Set conversation as started
    setHasStartedConversation(true);

    // Track empty state chat search query
    trackSearch(message.trim(), 0, {
      userType: 'buyer',
      searchContext: 'chat_empty_state',
      page: '/buyers/chat',
      chatMode: useOrchestrator ? 'advanced' : 'standard'
    });

    // Set processing flag to prevent duplicate submissions
    setIsProcessingMessage(true);

    // Lazy load session and history before sending message
    const session = await ensureSessionAndLoadHistory();
    if (!session && !currentSession) {
      toast({
        title: "Session Error",
        description: "Failed to create chat session. Please try again.",
        variant: "destructive",
      });
      setIsProcessingMessage(false);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
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
          query: message.substring(0, 50) + '...',
          user: user?.email
        });
        // Use new orchestrator service with streaming
        await handleOrchestratorMessage(message, userMessage, startTime);
      } else {
        console.log('🎯 Using Standard Mode (OpenAI Direct)', {
          model: 'gpt-4-turbo',
          provider: 'OpenAI',
          mode: 'Standard',
          query: message.substring(0, 50) + '...',
          user: user?.email
        });
        // Fallback to existing OpenAI service
        await handleLegacyMessage(message, userMessage, startTime);
      }
    } catch (error: any) {
      console.error("🚨 CHAT ERROR:", {
        system: useOrchestrator ? 'Chat Orchestrator' : 'OpenAI Direct',
        error: error.message,
        user: user?.email,
        query: message
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

    // Set conversation as started when sending any message
    setHasStartedConversation(true);

    // DISABLED: First search email trigger (templates not yet implemented)
    // try {
    //   const userName = user.user_metadata?.full_name || user.email || 'User';
    //   await triggerFirstSearchEmail(user.id, user.email, userName, inputMessage.trim());
    // } catch (error) {
    //   console.warn('Failed to trigger first search email:', error);
    // }

    // Get message content for tracking
    const messageContent = inputMessage.trim();

    // Track chat search query
    trackSearch(messageContent, 0, {
      userType: 'buyer',
      searchContext: 'chat',
      page: '/buyers/chat',
      chatMode: useOrchestrator ? 'advanced' : 'standard'
    });

    // Set processing flag to prevent duplicate submissions
    setIsProcessingMessage(true);

    // Lazy load session and history before sending message
    const session = await ensureSessionAndLoadHistory();
    if (!session && !currentSession) {
      toast({
        title: "Session Error",
        description: "Failed to create chat session. Please try again.",
        variant: "destructive",
      });
      setIsProcessingMessage(false);
      return;
    }

    // Clear input to prevent duplicates (messageContent already captured above)
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
      const titleName = title.title_name_en || title.title_name_kr || 'Unknown Title';

      // Enhanced title card click tracking for GA4/GTM
      trackTitleCardClick(
        title.title_id,
        titleName,
        'card_click',
        'chat',
        accountType || 'buyer',
        {
          chat_mode: useOrchestrator ? 'advanced' : 'standard',
          session_id: currentSession?.id,
          message_id: messageId,
          user_prompt: userPrompt,
          recommendation_score: title.score
        }
      );

      // Legacy title view tracking (keep for backward compatibility)
      trackTitleView(title.title_id, titleName, 'chat', useOrchestrator ? 'advanced' : 'standard');

      // Record title view interaction
      if (currentSession && user) {
        await chatHistoryService.recordInteraction({
          session_id: currentSession.id,
          user_id: user.id,
          interaction_type: 'title_view',
          target_id: title.title_id,
          target_title: titleName,
          metadata: {
            source: 'recommended_titles_card',
            title_name_en: title.title_name_en,
            title_name_kr: title.title_name_kr,
            recommendation_score: title.score,
            timestamp: new Date().toISOString()
          }
        });
      }

      window.open(`/buyers/titles/${title.title_id}`, '_blank');
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

  // Show loading while account type is being determined
  if (accountTypeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  // Show empty state when no conversation has started
  if (shouldShowEmptyState) {
    return (
      <ChatEmptyState
        onSubmitMessage={handleEmptyStateMessage}
        isLoading={isLoading || isProcessingMessage || isStreaming}
        showHistory={showHistory}
        onToggleHistory={() => {
          setShowHistory(!showHistory);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto flex flex-col min-h-screen">
        {/* Header - Uses PageContainer padding - Remove AI ASSISTANT in conversation mode */}
        <div className="page-padding-x" style={{ paddingTop: 'var(--page-padding-y-mobile)', paddingBottom: 'var(--page-padding-y-mobile)' }}>
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="flex items-center gap-2">
                {useOrchestrator && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                    Enhanced
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                onClick={() => {
                  setMessages([]);
                  setInputMessage('');
                  setHasStartedConversation(false);
                  setShowAllMessages(false);
                }}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </Button>
            </div>
            </div>
          </div>
        </div>

        {/* PRD 2.1: Upgrade prompt for basic tier users */}
        <div className="page-padding-x mb-4">
          <ChatUpgradePrompt
            variant="banner"
            size="sm"
            dismissible={true}
          />
        </div>

        {/* Chat Container - Clean, no card wrapper */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Container - Clean ChatGPT style */}
          <div className="flex-1 overflow-y-auto py-4 space-y-6 pb-40 page-padding-x">
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
                {message.sender === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-3xl w-full bg-[#F5F3F0] border border-stone-200 rounded-2xl p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <User size={12} className="text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">You</span>
                        <span className="text-xs text-gray-400">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-800">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 pt-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-green-600 to-green-700">
                        <Sparkles size={14} className="text-white" />
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700">Jinu</span>
                        <span className="text-xs text-gray-400">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-800">
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
                )}
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
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:ml-72">
        <div className="max-w-7xl mx-auto py-4">
          <div className="page-padding-x flex justify-center">
            <div className="w-[90%] bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
              <div className="flex items-end gap-2 p-3">
                <textarea
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Describe the story you are looking for..."
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
              <div className="px-7 pb-2 text-xs text-gray-400 flex justify-end items-center">
                <div className="flex items-center gap-2">
                  {/* Mode Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 px-3 py-2 sm:px-2 sm:py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                        {useOrchestrator ? (
                          <>
                            <Sparkles size={16} className="text-pro-purple sm:w-3 sm:h-3" />
                            <span className="text-gray-700 font-medium">Advanced</span>
                            <ProBadge tier="pro" size="sm" showIcon={false} className="ml-0.5" />
                          </>
                        ) : (
                          <>
                            <Bot size={16} className="text-gray-600 sm:w-3 sm:h-3" />
                            <span className="text-gray-700 font-medium">Standard</span>
                          </>
                        )}
                        <ChevronDown size={16} className="text-gray-500 ml-0.5 sm:w-3 sm:h-3" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" sideOffset={8} className="min-w-[180px] bg-white">
                      <DropdownMenuItem
                        onClick={() => {
                          console.log('🎛️ Chat Mode Changed to Standard', {
                            from: 'Enhanced (OpenAI GPT-4)',
                            to: 'Standard (OpenAI Direct)',
                            timestamp: new Date().toISOString()
                          });

                          // Track chat mode change
                          trackEvent('mode_change', 'chat', 'advanced_to_standard');

                          setUseOrchestrator(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Bot size={16} className="mr-2 text-gray-600" />
                        <span>Standard (Basic)</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          if (hasMinimumTier('pro')) {
                            console.log('🎛️ Chat Mode Changed to Advanced', {
                              from: 'Standard (OpenAI Direct)',
                              to: 'Enhanced (OpenAI GPT-4)',
                              timestamp: new Date().toISOString()
                            });

                            // Track chat mode change and advanced usage
                            trackEvent('mode_change', 'chat', 'standard_to_advanced');
                            trackAdvancedChatUsage(user?.id);

                            setUseOrchestrator(true);
                          } else {
                            setPremiumPopupOpen(true);
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <Sparkles size={16} className="mr-2 text-pro-purple" />
                        <span>Advanced</span>
                        <ProBadge tier="pro" size="sm" showIcon={false} className="ml-auto" />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {isStreaming && (
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      Streaming
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Feature Popup for Advanced Mode */}
      <PremiumFeaturePopup
        isOpen={premiumPopupOpen}
        onClose={() => setPremiumPopupOpen(false)}
        featureName="Advanced Chat Mode"
      />
    </div>
  );
}