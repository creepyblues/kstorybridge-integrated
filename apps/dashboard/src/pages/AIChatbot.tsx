import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, useToast } from "@kstorybridge/ui";
import { Send, Bot, User, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { chatbotService } from "@/services/chatbotService";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  titles?: any[]; // For displaying recommended titles
}

interface ChatbotResponse {
  message: string;
  titles: any[];
  searchQuery?: string;
}

export default function AIChatbot() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is authorized
  const isAuthorized = user?.email === 'sungho@dadble.com' || user?.email === 'kevin@sandstoneartists.com';

  useEffect(() => {
    if (!isAuthorized) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the AI Chatbot.",
        variant: "destructive",
      });
      navigate("/profile");
      return;
    }

    // Initial greeting message with dynamic popular searches
    const initializeGreeting = async () => {
      try {
        const popularSearches = await chatbotService.getPopularSearches();
        
        setMessages([
          {
            id: Date.now().toString(),
            content: `👋 Hello! I'm your AI assistant for discovering Korean IPs. I can help you find titles based on:

• **Genre & Tone** (romantic comedy, dark thriller, etc.)
• **Content Format** (webtoon, novel, manhwa, etc.)
• **Themes** (revenge, family drama, coming of age, etc.)
• **Comparable Titles** ("similar to Squid Game", "like Parasite", etc.)
• **Special Features** (with pitch decks, completed series, etc.)

**💡 Popular searches right now:**
${popularSearches.map(search => `• "${search}"`).join('\n')}

What type of Korean IP are you looking for today?`,
            sender: 'bot',
            timestamp: new Date(),
          }
        ]);
      } catch (error) {
        console.error("Failed to load popular searches:", error);
        // Fallback to static greeting
        setMessages([
          {
            id: Date.now().toString(),
            content: `👋 Hello! I'm your AI assistant for discovering Korean IPs. I can help you find titles based on:

• **Genre & Tone** (romantic comedy, dark thriller, etc.)
• **Content Format** (webtoon, novel, manhwa, etc.)
• **Themes** (revenge, family drama, coming of age, etc.)
• **Comparable Titles** ("similar to Squid Game", "like Parasite", etc.)
• **Special Features** (with pitch decks, completed series, etc.)

**Examples to try:**
• "romantic comedy webtoons"
• "dark thriller with revenge theme"
• "fantasy novels with female protagonists"
• "titles similar to Kingdom"

What type of Korean IP are you looking for today?`,
            sender: 'bot',
            timestamp: new Date(),
          }
        ]);
      }
    };

    initializeGreeting();
  }, [isAuthorized, navigate, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const analyzeUserQuery = async (query: string): Promise<ChatbotResponse> => {
    try {
      return await chatbotService.searchTitles(query);
    } catch (error) {
      console.error("Error in chatbot search:", error);
      return {
        message: "I apologize, but I encountered an error while searching. Please try again with a different query.",
        titles: [],
        searchQuery: query
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await analyzeUserQuery(userMessage.content);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: 'bot',
        timestamp: new Date(),
        titles: response.titles
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I encountered an error while searching for titles. Please try again with a different query.",
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Search Error",
        description: "Failed to search titles. Please try again.",
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

  const formatTitleCard = (title: any) => (
    <div key={title.title_id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => navigate(`/titles/${title.title_id}`)}>
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

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink leading-tight mb-2">
              🤖 AI IP Discovery Chatbot
            </h1>
            <p className="text-sm sm:text-base text-midnight-ink-600">
              Find the perfect Korean IPs using natural language search
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl h-[600px] flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
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
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Message Content */}
                <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-hanok-teal text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    
                    {/* Title Recommendations */}
                    {message.titles && message.titles.length > 0 && (
                      <div className="mt-4 space-y-3">
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
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Searching for titles...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me about Korean IPs... e.g., 'romantic comedy webtoons' or 'dark thriller like Squid Game'"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-hanok-teal text-sm"
                  rows={2}
                  disabled={isLoading}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-gray-400">
                  <Sparkles size={12} />
                  <span>AI Powered</span>
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-4 py-3 rounded-xl self-end"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            💡 <strong>Pro tip:</strong> Be specific with genres, themes, or comparable titles for better results
          </p>
        </div>
      </div>
    </div>
  );
}