import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, useToast } from "@kstorybridge/ui";
import { Send, Bot, User, Loader2, ArrowLeft, Sparkles, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { openaiService } from "@/services/openaiService";
import { titlesService } from "@/services/titlesService";
import { chatHistoryService, type ChatSession } from "@/services/chatHistoryService";
import { ChatbotFeedback } from "@/components/ChatbotFeedback";
import { TitleFeedback } from "@/components/TitleFeedback";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  titles?: any[];
  suggestedQueries?: string[];
  messageId?: string; // Database message ID for tracking
}

// Component to format markdown-like content with title matching and linking
const FormattedMessage = ({ content, navigate, titleData, allMessages }: { content: string, navigate: any, titleData?: any[], allMessages?: Message[] }) => {
  const formatText = (text: string) => {
    // Split by lines to preserve line breaks
    return text.split('\n').map((line, idx) => {
      // Skip empty lines but preserve spacing
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      
      // Handle numbered lists (1. 2. etc.) - simple formatting only
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+\.\s)(.*)/);
        if (match) {
          const [, number, text] = match;
          return (
            <div key={idx} className="mt-1 flex">
              <span className="font-medium mr-2 text-blue-600">{number}</span>
              <div className="flex-1">{formatInlineText(text, true)}</div>
            </div>
          );
        }
      }
      
      // Handle bullet points (• - *)
      if (/^[\s]*[•\-\*]\s/.test(line)) {
        const cleanedLine = line.replace(/^[\s]*[•\-\*]\s/, '');
        return (
          <div key={idx} className="mt-1 flex">
            <span className="mr-2 text-blue-600">•</span>
            <div>{formatInlineText(cleanedLine)}</div>
          </div>
        );
      }
      
      // Regular line
      return (
        <div key={idx} className={idx > 0 ? 'mt-1' : ''}>
          {formatInlineText(line)}
        </div>
      );
    });
  };
  
  // Helper function to find title ID by title name from available title data
  const findTitleIdByName = (titleName: string): string | null => {
    // Clean the title name by normalizing outer quotes and removing trailing punctuation
    let cleanedName = titleName
      .replace(/^["""'']+|["""'']+$/g, '"')  // Normalize only leading/trailing quotes
      .replace(/[.,!?;:]+$/, '')  // Remove only trailing punctuation
      .trim();
    
    // Debug logging in development
    if (import.meta.env.DEV && titleName.toLowerCase().includes('first love')) {
      console.log('🔍 Title matching debug:', {
        originalTitle: titleName,
        cleanedName,
        messageSpecificTitles: titleData?.length || 0,
        allMessagesCount: allMessages?.length || 0
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
    
    return null;
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
    
    // Remove asterisks used for formatting (e.g., "*Title*" -> "Title")
    cleanedText = cleanedText.replace(/\*/g, '').trim();
    
    return cleanedText;
  };

  const formatInlineText = (text: string, isNumberedRecommendation = false) => {
    // Handle quoted and bold text - add "FIND MORE" links only for numbered recommendations
    const parts = text.split(/(".*?"|[\*]{2}.*?[\*]{2})/g);
    return parts.map((part, partIdx) => {
      // Handle quoted text with possible title ID
      if (part.startsWith('"') && part.endsWith('"')) {
        const quotedText = part.slice(1, -1);
        if (isNumberedRecommendation) {
          // Check if the quoted text contains a title ID pattern [ID: xxxxx] (Title Name)
          // Extract just the title name without the ID pattern
          const titleIdPattern = /\[ID:\s*([a-f0-9-]{8,})\]\s*\(([^)]+)\)/i;
          const titleIdMatch = quotedText.match(titleIdPattern);
          
          if (titleIdMatch) {
            const titleId = titleIdMatch[1];
            const titleName = titleIdMatch[2];
            // Return just the clickable title name without the FIND MORE button
            return (
              <button
                key={partIdx}
                onClick={() => navigate(`/buyers/titles/${titleId}`)}
                className="font-medium text-hanok-teal hover:text-hanok-teal-600 underline hover:no-underline transition-all"
                title={`View "${titleName}" details`}
              >
                "{titleName}"
              </button>
            );
          } else {
            // Try to find title ID by name lookup
            const foundTitleId = findTitleIdByName(quotedText);
            if (foundTitleId) {
              // Return just the clickable title name
              return (
                <button
                  key={partIdx}
                  onClick={() => navigate(`/buyers/titles/${foundTitleId}`)}
                  className="font-medium text-hanok-teal hover:text-hanok-teal-600 underline hover:no-underline transition-all"
                  title={`View "${quotedText}" details`}
                >
                  "{quotedText}"
                </button>
              );
            } else {
              // Fallback to search if no title ID found
              const searchQuery = extractEnglishTitle(quotedText);
              return (
                <span key={partIdx} className="inline-flex items-center gap-2">
                  <span className="font-medium">"{quotedText}"</span>
                  <button
                    onClick={() => navigate(`/search-results?search=${encodeURIComponent(searchQuery)}`)}
                    className="text-xs text-hanok-teal hover:text-hanok-teal-600 underline hover:no-underline transition-all"
                    title={`Search for "${searchQuery}"`}
                  >
                    → FIND MORE
                  </button>
                </span>
              );
            }
          }
        } else {
          return <span key={partIdx} className="font-medium">"{quotedText}"</span>;
        }
      }
      
      // Handle bold text with possible title ID
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        if (isNumberedRecommendation) {
          // Check if the bold text contains a title ID pattern [ID: xxxxx] (Title Name)
          const titleIdPattern = /\[ID:\s*([a-f0-9-]{8,})\]\s*\(([^)]+)\)/i;
          const titleIdMatch = boldText.match(titleIdPattern);
          
          if (titleIdMatch) {
            const titleId = titleIdMatch[1];
            const titleName = titleIdMatch[2];
            // Return just the clickable title name without the FIND MORE button
            return (
              <button
                key={partIdx}
                onClick={() => navigate(`/buyers/titles/${titleId}`)}
                className="font-semibold text-hanok-teal hover:text-hanok-teal-600 underline hover:no-underline transition-all"
                title={`View "${titleName}" details`}
              >
                {titleName}
              </button>
            );
          } else {
            // Try to find title ID by name lookup
            const foundTitleId = findTitleIdByName(boldText);
            if (foundTitleId) {
              // Return just the clickable title name
              return (
                <button
                  key={partIdx}
                  onClick={() => navigate(`/buyers/titles/${foundTitleId}`)}
                  className="font-semibold text-hanok-teal hover:text-hanok-teal-600 underline hover:no-underline transition-all"
                  title={`View "${boldText}" details`}
                >
                  {boldText}
                </button>
              );
            } else {
              // Fallback to search if no title ID found
              const searchQuery = extractEnglishTitle(boldText);
              return (
                <span key={partIdx} className="inline-flex items-center gap-2">
                  <strong className="font-semibold">{boldText}</strong>
                  <button
                    onClick={() => navigate(`/search-results?search=${encodeURIComponent(searchQuery)}`)}
                    className="text-xs text-hanok-teal hover:text-hanok-teal-600 underline hover:no-underline transition-all"
                    title={`Search for "${searchQuery}"`}
                  >
                    → FIND MORE
                  </button>
                </span>
              );
            }
          }
        } else {
          return <strong key={partIdx} className="font-semibold">{boldText}</strong>;
        }
      }
      
      return part;
    });
  };

  const renderTitleCard = (title: any, onTitleCardClick: (title: any) => void) => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
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

  return <div>{formatText(content)}</div>;
};

export default function OpenAIChatbot() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is authorized (same users as existing chatbot)
  const isAuthorized = user?.email === 'sungho@dadble.com' || user?.email === 'kevin@sandstoneartists.com';

  // Function to get messages to display (truncated or full)
  const getDisplayMessages = () => {
    if (showAllMessages || messages.length <= 5) {
      return messages;
    }
    
    // Show greeting + last 4 messages (2 conversations: user->bot, user->bot)
    const greeting = messages.find(msg => 
      msg.sender === 'bot' && msg.content.includes('Hello! I\'m your OpenAI-powered assistant')
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
      msg.sender === 'bot' && msg.content.includes('Hello! I\'m your OpenAI-powered assistant')
    );
    
    const visibleCount = greeting ? 5 : 4; // greeting + 4 recent, or just 4 recent
    return Math.max(0, messages.length - visibleCount);
  };
  
  // Debug logging removed to prevent console alerts

  useEffect(() => {
    if (!isAuthorized) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the OpenAI Chatbot.",
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
              msg.sender === 'bot' && msg.content.includes('Hello! I\'m your OpenAI-powered assistant')
            );
            
            if (!hasGreeting) {
              restoredMessages.unshift({
                id: 'greeting',
                content: `🤖 Hello! I'm your OpenAI-powered assistant for Korean IP discovery. I use advanced AI to understand your preferences and provide personalized recommendations.

**What makes me different:**
• **Smart Understanding** - I comprehend nuanced requests and context
• **Conversational** - Ask follow-up questions and have natural discussions
• **Comprehensive Analysis** - I analyze themes, tones, and complex criteria
• **Learning** - I remember our conversation to give better suggestions

**Try asking me things like:**
• "I love dark psychological thrillers like 'Strangers from Hell'. What would you recommend?"
• "What are some heartwarming family dramas similar to 'Reply 1988'?"
• "I'm looking for strong female protagonists in fantasy webtoons"
• "Recommend something completely different from what's popular"

What kind of Korean content are you in the mood for today?`,
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
                content: `🤖 Hello! I'm your OpenAI-powered assistant for Korean IP discovery. I use advanced AI to understand your preferences and provide personalized recommendations.

**What makes me different:**
• **Smart Understanding** - I comprehend nuanced requests and context
• **Conversational** - Ask follow-up questions and have natural discussions
• **Comprehensive Analysis** - I analyze themes, tones, and complex criteria
• **Learning** - I remember our conversation to give better suggestions

**Try asking me things like:**
• "I love dark psychological thrillers like 'Strangers from Hell'. What would you recommend?"
• "What are some heartwarming family dramas similar to 'Reply 1988'?"
• "I'm looking for strong female protagonists in fantasy webtoons"
• "Recommend something completely different from what's popular"

What kind of Korean content are you in the mood for today?`,
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
            content: `🤖 Hello! I'm your OpenAI-powered assistant for Korean IP discovery. I use advanced AI to understand your preferences and provide personalized recommendations.

**What makes me different:**
• **Smart Understanding** - I comprehend nuanced requests and context
• **Conversational** - Ask follow-up questions and have natural discussions
• **Comprehensive Analysis** - I analyze themes, tones, and complex criteria
• **Learning** - I remember our conversation to give better suggestions

**Try asking me things like:**
• "I love dark psychological thrillers like 'Strangers from Hell'. What would you recommend?"
• "What are some heartwarming family dramas similar to 'Reply 1988'?"
• "I'm looking for strong female protagonists in fantasy webtoons"
• "Recommend something completely different from what's popular"

What kind of Korean content are you in the mood for today?`,
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
      hasSession: !!currentSession,
      hasUser: !!user,
      inputMessage: inputMessage.substring(0, 50) + '...'
    });

    if (!inputMessage.trim() || isLoading || !user) {
      console.log('❌ handleSendMessage early return:', {
        noInput: !inputMessage.trim(),
        isLoading,
        noUser: !user
      });
      return;
    }

    // Allow chat to work without database session (fallback mode)
    if (!currentSession) {
      console.log('⚠️ No session available, working in fallback mode (no history saving)');
    }

    console.log('✅ handleSendMessage proceeding with message processing');

    // Starting message processing

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    
    // Reset to truncated view when starting new conversation
    if (showAllMessages) {
      setShowAllMessages(false);
    }

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

    const startTime = Date.now();

    try {
      // Get conversation history for context
      const conversationHistory = messages.slice(-6).map(msg => 
        `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      );

      console.log('🤖 Calling OpenAI service:', {
        query: userMessage.content.substring(0, 100) + '...',
        historyLength: conversationHistory.length,
        userId: user?.id?.substring(0, 8) + '...' || 'no-user',
        sessionId: currentSession?.id?.substring(0, 8) + '...' || 'no-session'
      });

      const response = await openaiService.generateChatResponse(
        userMessage.content, 
        conversationHistory,
        user?.id,
        currentSession?.id // Pass session ID if available
      );

      console.log('✅ OpenAI service response received:', {
        hasMessage: !!response.message,
        messageLength: response.message?.length || 0,
        titlesCount: response.recommendedTitles?.length || 0,
        suggestedQueriesCount: response.suggestedQueries?.length || 0
      });
      
      const responseTime = Date.now() - startTime;
      // OpenAI chatbot success - response processed

      // Create defensive copy to prevent mutation during database operations
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: 'bot',
        timestamp: new Date(),
        titles: response.recommendedTitles ? [...response.recommendedTitles] : undefined,
        suggestedQueries: response.suggestedQueries ? [...response.suggestedQueries] : undefined
      };

      // Created bot message with titles

      // Record AI response in database (if session available)
      let botDbMessage = null;
      if (currentSession) {
        try {
          botDbMessage = await chatHistoryService.recordMessage({
            session_id: currentSession.id,
            user_id: user.id,
            message_type: 'ai_response',
            content: response.message,
            tokens_used: 0, // Could be calculated from OpenAI response if available
            response_time_ms: responseTime,
          });
        } catch (error) {
          console.warn('Failed to record AI response:', error);
        }
      }

      if (botDbMessage) {
        botMessage.messageId = botDbMessage.id;

        // Record title recommendations if any
        if (response.recommendedTitles && response.recommendedTitles.length > 0) {
          const recommendations = response.recommendedTitles.map((title, index) => ({
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

        // Recorded recommendations

        // Record suggested queries if any
        if (response.suggestedQueries && response.suggestedQueries.length > 0) {
          const suggestedQueries = response.suggestedQueries.map((query, index) => ({
            message_id: botDbMessage.id,
            session_id: currentSession.id,
            suggested_query: query,
            query_position: index,
          }));

          await chatHistoryService.recordSuggestedQueries(suggestedQueries);
        }

        // Recorded queries
      }

      // Adding message to state

      setMessages(prev => {
        // Setting messages state
        return [...prev, botMessage];
      });
    } catch (error: any) {
      console.error("🚨 OPENAI CHATBOT ERROR:", {
        system: 'OpenAI API with Vector Search',
        service: 'openaiService.generateChatResponse',
        error: error.message,
        fullError: error,
        user: user?.email,
        query: inputMessage
      });
      
      const responseTime = Date.now() - startTime;
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I encountered an error: ${error.message}

Please make sure your OpenAI API key is properly configured. You can test it by visiting the OpenAI Test page.`,
        sender: 'bot',
        timestamp: new Date(),
      };

      // Record error response (if session available)
      if (currentSession) {
        try {
          await chatHistoryService.recordMessage({
            session_id: currentSession.id,
            user_id: user.id,
            message_type: 'ai_response',
            content: `ERROR: ${error.message}`,
            response_time_ms: responseTime,
          });
        } catch (dbError) {
          console.warn('Failed to record error message:', dbError);
        }
      }
      
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "OpenAI Error",
        description: error.message || "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
      <div key={title.title_id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow group relative">
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
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-3 px-3 sm:px-4 pt-3 sm:pt-4">
          <Button
            onClick={() => navigate("/profile")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-midnight-ink leading-tight mb-1">
              🧠 OpenAI Powered Chatbot
            </h1>
            <p className="text-xs sm:text-sm text-midnight-ink-600">
              Advanced AI conversations for Korean IP discovery
            </p>
          </div>
        </div>

        {/* Chat Container - Full width and height with minimal margins */}
        <Card className="bg-white border border-gray-200 shadow-lg rounded-xl flex-1 flex flex-col overflow-hidden mx-2 sm:mx-3 mb-2 sm:mb-3">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
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
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === 'user' 
                    ? 'bg-hanok-teal text-white' 
                    : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                }`}>
                  {message.sender === 'user' ? <User size={16} /> : <Brain size={16} />}
                </div>

                {/* Message Content */}
                <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-[90%] sm:max-w-[85%] lg:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-hanok-teal text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="text-sm prose prose-sm max-w-none">
                      <FormattedMessage content={message.content} navigate={navigate} titleData={message.titles} allMessages={messages} />
                    </div>
                    
                    {/* Suggested Queries */}
                    {message.suggestedQueries && message.suggestedQueries.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-600">💡 Try these searches:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestedQueries.map((query, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestedQuery(query, message.messageId)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-lg border border-blue-200 transition-colors"
                            >
                              "{query}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Always show actual database titles - simple and reliable */}
                    {message.titles && message.titles.length > 0 && (() => {
                      // Find the preceding user message for context
                      const userMessage = messagesArray.slice(0, index).reverse().find(m => m.sender === 'user');
                      const userPrompt = userMessage?.content || "User query";
                      
                      return (
                        <div className="mt-4 space-y-3">
                          <div className="border-t border-gray-200 pt-3">
                            <p className="text-sm font-semibold text-gray-700 mb-3">📚 Here are additional titles you may want to consider:</p>
                            <div className="space-y-2">
                              {message.titles.map(title => formatTitleCard(title, message.messageId, userPrompt))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Feedback Component for Bot Messages - Disabled in favor of per-title feedback */}
                  {false && message.sender === 'bot' && message.messageId && !message.content.includes('Hello! I\'m your OpenAI-powered assistant') && (() => {
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
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Message */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center flex-shrink-0">
                  <Brain size={16} />
                </div>
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
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

          {/* Input Area */}
          <div className="border-t border-gray-200 p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything about Korean IPs..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs sm:text-sm"
                  rows={2}
                  disabled={isLoading || isLoadingHistory}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-gray-400 hidden sm:flex">
                  <Sparkles size={12} />
                  <span>OpenAI</span>
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading || isLoadingHistory}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl self-end"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}