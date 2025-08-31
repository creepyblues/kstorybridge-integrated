import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, useToast } from "@kstorybridge/ui";
import { Send, Bot, User, Loader2, ArrowLeft, Sparkles, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { openaiService } from "@/services/openaiService";
import { titlesService } from "@/services/titlesService";
import { chatHistoryService, type ChatSession } from "@/services/chatHistoryService";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  titles?: any[];
  suggestedQueries?: string[];
  messageId?: string; // Database message ID for tracking
}

// Component to format markdown-like content
const FormattedMessage = ({ content, onTitleClick }: { content: string; onTitleClick?: (title: string) => void }) => {
  const formatText = (text: string) => {
    // Split by lines to preserve line breaks
    return text.split('\n').map((line, idx) => {
      // Skip empty lines but preserve spacing
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      
      // Handle numbered lists (1. 2. etc.)
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+\.\s)(.*)/);
        if (match) {
          const [, number, text] = match;
          return (
            <div key={idx} className="mt-1 flex">
              <span className="font-medium mr-2 text-blue-600">{number}</span>
              <div>{formatInlineText(text)}</div>
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
  
  const formatInlineText = (text: string) => {
    // Handle bold text **text** and potential title links
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        
        // Check if this looks like a Korean title
        const isKoreanTitle = (
          // Contains Korean characters (Hangul or Hanja)
          /[\u3131-\u3163\u4e00-\u9fff\uac00-\ud7af]/.test(boldText) || 
          // Contains parentheses (common for Korean/English title pairs)
          /\([^)]*\)/.test(boldText) ||
          // Common title patterns
          /^(The|A|An)\s+\w+/.test(boldText) ||
          // Title-like capitalization (multiple capital words)
          /^[A-Z][a-z]*(\s+[A-Z][a-z]*){1,}/.test(boldText) ||
          // Common words found in Korean content titles
          /(Owner|Master|Extreme|Two-Time|Perfect|Divine|Ultimate|Secret|Love|Heart|Dream|Night|Day|Time|King|Queen|Princess|Prince|Story|Tale|Legend|Chronicles|Diary|Dark|Light|Shadow|Dragon|Phoenix|Tiger|Wolf|Magic|Power|Strength|Hero|Villain|Warrior|Knight|Samurai|Ninja|Hunter|Guardian|Emperor|God|Devil|Angel|Demon|Ghost|Spirit|Soul|Life|Death|Birth|Marriage|Family|Romance|Friendship|School|Academy|University|Hospital|Hotel|Restaurant|Cafe|House|Home|City|Village|Island|Mountain|Sea|River|Lake|Sky|Cloud|Rain|Snow|Wind|Fire|Water|Earth|Stone|Metal|Gold|Silver|Diamond|Crystal)/.test(boldText)
        ) && boldText.length > 3 && boldText.length < 100;
        
        if (isKoreanTitle && onTitleClick) {
          return (
            <strong key={partIdx} className="font-semibold text-hanok-teal cursor-pointer hover:text-hanok-teal-600 underline decoration-dotted" 
                    onClick={() => onTitleClick(boldText)}>
              {boldText}
            </strong>
          );
        }
        
        return <strong key={partIdx} className="font-semibold">{boldText}</strong>;
      }
      return part;
    });
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is authorized (same users as existing chatbot)
  const isAuthorized = user?.email === 'sungho@dadble.com' || user?.email === 'kevin@sandstoneartists.com';
  
  console.log('🚀 OPENAI CHATBOT COMPONENT LOADED:', {
    system: 'OpenAI API with Vector Search',
    service: 'openaiService.generateChatResponse',
    user: user?.email,
    isAuthorized,
    environment: import.meta.env.PROD ? 'production' : 'development'
  });

  useEffect(() => {
    if (!isAuthorized) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the OpenAI Chatbot.",
        variant: "destructive",
      });
      navigate("/profile");
      return;
    }

    // Initialize chat session and load history
    const initializeSession = async () => {
      if (!user) return;

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
          console.log('📝 Chat session initialized:', session.id);
          
          // Load conversation history from this session
          const history = await chatHistoryService.getSessionMessages(session.id);
          
          if (history && history.length > 0) {
            // Convert database messages to UI messages
            const restoredMessages: Message[] = history.map(msg => ({
              id: msg.id,
              content: msg.content,
              sender: msg.message_type === 'user_prompt' ? 'user' : 'bot',
              timestamp: new Date(msg.created_at),
              messageId: msg.id
            }));
            
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
            console.log(`📚 Loaded ${history.length} messages from session history`);
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
  }, [isAuthorized, navigate, toast, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentSession || !user) return;

    console.log('🤖 OPENAI CHATBOT: Starting message processing', {
      system: 'OpenAI API with Vector Search',
      service: 'openaiService.generateChatResponse',
      query: inputMessage.trim(),
      user: user?.email,
      sessionId: currentSession.id
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Record user message in database
    const userDbMessage = await chatHistoryService.recordMessage({
      session_id: currentSession.id,
      user_id: user.id,
      message_type: 'user_prompt',
      content: userMessage.content,
    });

    if (userDbMessage) {
      userMessage.messageId = userDbMessage.id;
    }

    const startTime = Date.now();

    try {
      // Get conversation history for context
      const conversationHistory = messages.slice(-6).map(msg => 
        `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      );

      const response = await openaiService.generateChatResponse(
        userMessage.content, 
        conversationHistory,
        user?.id,
        currentSession.id // Pass the actual session ID
      );
      
      const responseTime = Date.now() - startTime;
      console.log('✅ OPENAI CHATBOT SUCCESS:', {
        system: 'OpenAI API with Vector Search',
        responseTime: responseTime + 'ms',
        titlesFound: response.recommendedTitles?.length || 0,
        vectorSearchUsed: response.vectorSearchUsed,
        user: user?.email,
        titlesData: response.recommendedTitles?.slice(0, 2), // Show first 2 titles for debugging
        hasValidTitles: response.recommendedTitles?.some(t => t.title_id)
      });
      
      console.log('🔍 OPENAI CHATBOT: Creating bot message with titles:', {
        hasRecommendedTitles: !!response.recommendedTitles,
        titlesLength: response.recommendedTitles?.length,
        firstTitleStructure: response.recommendedTitles?.[0] ? Object.keys(response.recommendedTitles[0]) : 'No titles',
        firstTitleData: response.recommendedTitles?.[0],
        allTitlesHaveId: response.recommendedTitles?.every(t => !!t.title_id)
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: 'bot',
        timestamp: new Date(),
        titles: response.recommendedTitles,
        suggestedQueries: response.suggestedQueries
      };

      // Record AI response in database
      const botDbMessage = await chatHistoryService.recordMessage({
        session_id: currentSession.id,
        user_id: user.id,
        message_type: 'ai_response',
        content: response.message,
        tokens_used: 0, // Could be calculated from OpenAI response if available
        response_time_ms: responseTime,
      });

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
      }

      setMessages(prev => [...prev, botMessage]);
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

      // Record error response
      await chatHistoryService.recordMessage({
        session_id: currentSession.id,
        user_id: user.id,
        message_type: 'ai_response',
        content: `ERROR: ${error.message}`,
        response_time_ms: responseTime,
      });
      
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

  const handleTitleClick = async (titleName: string) => {
    try {
      // Search for the title by name
      const allTitles = await titlesService.getAllTitles();
      const matchingTitle = allTitles.find(title => 
        title.title_name_en?.includes(titleName) || 
        title.title_name_kr?.includes(titleName) ||
        titleName.includes(title.title_name_en || '') ||
        titleName.includes(title.title_name_kr || '')
      );

      // Record title click interaction
      if (currentSession && user) {
        await chatHistoryService.recordInteraction({
          session_id: currentSession.id,
          user_id: user.id,
          interaction_type: 'title_click',
          target_id: matchingTitle?.title_id || 'unknown',
          target_title: titleName,
          metadata: {
            clicked_title_name: titleName,
            found_match: !!matchingTitle,
            matched_title_id: matchingTitle?.title_id,
            matched_title_name_en: matchingTitle?.title_name_en,
            matched_title_name_kr: matchingTitle?.title_name_kr,
            timestamp: new Date().toISOString()
          }
        });
      }

      if (matchingTitle) {
        navigate(`/titles/${matchingTitle.title_id}`);
      } else {
        toast({
          title: "Title Not Found",
          description: `Could not find details for "${titleName}"`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error finding title:", error);
      toast({
        title: "Error",
        description: "Failed to find title details",
        variant: "destructive",
      });
    }
  };

  const formatTitleCard = (title: any) => {
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
      
      navigate(`/titles/${title.title_id}`);
    };

    return (
      <div key={title.title_id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
           onClick={handleTitleCardClick}>
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
              <span className="bg-hanok-teal text-white text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
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
            
            {!isLoadingHistory &&
            messages.map((message) => (
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
                      <FormattedMessage content={message.content} onTitleClick={handleTitleClick} />
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
                    
                    {/* Title Recommendations */}
                    {console.log('🎯 RENDERING TITLES:', {
                      hasTitles: !!message.titles,
                      titlesLength: message.titles?.length,
                      firstTitle: message.titles?.[0],
                      messageSender: message.sender
                    })}
                    {message.titles && message.titles.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-medium text-gray-600">📚 Recommended titles:</p>
                        {message.titles.map(formatTitleCard)}
                      </div>
                    )}
                  </div>
                  
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