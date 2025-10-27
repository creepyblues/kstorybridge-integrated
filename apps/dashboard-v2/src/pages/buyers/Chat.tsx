import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TitleCard } from '@/components/title/TitleCard';
import { chatOrchestratorService } from '@/services/chatOrchestratorService';
import { BuyerLayout } from '@/components/layout/BuyerLayout';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  titles?: any[];
}

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestedQueries = chatOrchestratorService.getSuggestedQueries();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || loading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Send to chatbot
      const response = await chatOrchestratorService.sendMessage(
        query,
        conversationHistory,
        user?.id
      );

      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        titles: response.titles?.map((t) => chatOrchestratorService.formatTitleForChat(t)),
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
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
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
        {messages.length === 0 ? (
          <ChatEmptyState
            onQuerySelect={handleSendMessage}
            suggestedQueries={suggestedQueries}
          />
        ) : (
          <div className="max-w-6xl mx-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={message.id} className="space-y-3">
                <ChatMessage message={message} isLatest={index === messages.length - 1} />

                {/* Title Cards */}
                {message.titles && message.titles.length > 0 && (
                  <div className="ml-12 space-y-2">
                    <p className="text-sm text-gray-600 font-medium">
                      Found {message.titles.length} title{message.titles.length !== 1 ? 's' : ''}:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {message.titles.slice(0, 6).map((title: any) => (
                        <TitleCard key={title.id} title={title} variant="compact" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-gray-500 ml-12">
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
