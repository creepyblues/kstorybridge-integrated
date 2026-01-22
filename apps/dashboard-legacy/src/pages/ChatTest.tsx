import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@kstorybridge/ui";
import { useToast } from "@/hooks/use-toast";
import { Send, Sparkles, User, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { chatOrchestratorService } from "@/services/chatOrchestratorService";
import { ChatTestingPanel } from "@/components/ChatTestingPanel";
import { PageContainer } from "@/components/layout/PageContainer";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const DEFAULT_SYSTEM_PROMPT = `You are Jinu, an AI assistant for KStoryBridge that helps media buyers discover Korean content.
Be conversational, friendly, and helpful. Focus on understanding user preferences and recommending relevant titles.`;

const DEFAULT_FORMATTING_RULES = `- Use natural, conversational language
- Format titles in quotes
- Keep responses concise and scannable
- Use bullet points for lists`;

export default function ChatTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Testing panel state
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [vectorSearchLimit, setVectorSearchLimit] = useState(10);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [formattingRules, setFormattingRules] = useState(DEFAULT_FORMATTING_RULES);
  const [lastRequest, setLastRequest] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);

  // Track applied config (what's actually being used in chat)
  const [appliedConfig, setAppliedConfig] = useState({
    model: 'gpt-4o-mini',
    vectorSearchLimit: 10,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    formattingRules: DEFAULT_FORMATTING_RULES
  });

  // Detect if current form values differ from applied config
  const hasUnappliedChanges =
    selectedModel !== appliedConfig.model ||
    vectorSearchLimit !== appliedConfig.vectorSearchLimit ||
    systemPrompt !== appliedConfig.systemPrompt ||
    formattingRules !== appliedConfig.formattingRules;

  // Access control - admin only
  const { accountType, loading: accountTypeLoading } = useAccountType();
  const isAuthorized = user?.email === 'sungho@kstorybridge.com' || user?.email === 'kevin@sandstoneartists.com';

  // Handle applying config changes
  const handleApplyChanges = () => {
    setAppliedConfig({
      model: selectedModel,
      vectorSearchLimit,
      systemPrompt,
      formattingRules
    });

    toast({
      title: "Config Applied",
      description: "New settings will be used in your next message."
    });
  };

  // Check authorization
  if (accountTypeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    toast({
      title: "Access Denied",
      description: "This page is restricted to administrators only.",
      variant: "destructive",
    });
    navigate("/buyers/chat");
    return null;
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isStreaming || !user) {
      return;
    }

    const messageContent = inputMessage.trim();
    setInputMessage("");

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    // Convert message history to orchestrator format
    const conversationHistory = chatOrchestratorService.formatConversationHistory([...messages, userMessage]);

    // Track the request for debugging (use applied config)
    const requestData = {
      messages: conversationHistory,
      model: appliedConfig.model,
      vectorSearchLimit: appliedConfig.vectorSearchLimit,
      systemPrompt: appliedConfig.systemPrompt,
      formattingRules: appliedConfig.formattingRules,
      timestamp: new Date().toISOString(),
    };
    setLastRequest(requestData);

    // Create a placeholder bot message for streaming
    const streamingBotMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'bot',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, streamingBotMessage]);

    const startTime = Date.now();

    try {
      await chatOrchestratorService.sendMessageStream(conversationHistory, {
        sessionId: undefined, // Test mode - no session tracking
        model: appliedConfig.model,
        vectorSearchLimit: appliedConfig.vectorSearchLimit,
        systemPrompt: appliedConfig.systemPrompt,
        formattingRules: appliedConfig.formattingRules,
        onChunk: (text: string) => {
          setMessages(prev => {
            return prev.map(msg =>
              msg.id === streamingBotMessage.id
                ? { ...msg, content: (msg.content || '') + text }
                : msg
            );
          });
        },
        onComplete: (fullResponse: string) => {
          const responseTime = Date.now() - startTime;

          // Track the response for debugging
          setLastResponse({
            content: fullResponse,
            responseTime: `${responseTime}ms`,
            model: selectedModel,
            timestamp: new Date().toISOString(),
          });

          setMessages(prev => {
            return prev.map(msg =>
              msg.id === streamingBotMessage.id
                ? { ...msg, content: fullResponse }
                : msg
            );
          });

          setIsStreaming(false);
        },
        onError: (error: string) => {
          console.error('❌ Chat test error:', error);

          setMessages(prev => {
            return prev.map(msg =>
              msg.id === streamingBotMessage.id
                ? {
                    ...msg,
                    content: `Error: ${error}`
                  }
                : msg
            );
          });

          setIsStreaming(false);

          toast({
            title: "Chat Error",
            description: error,
            variant: "destructive",
          });
        }
      });
    } catch (error: any) {
      console.error("🚨 Chat Test Error:", error);
      setIsStreaming(false);

      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageContainer>
        <div className="flex flex-col min-h-screen">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">Chat Testing</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500 text-white">
                ADMIN ONLY
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Test different AI models, prompts, and configurations
            </p>
          </div>

          {/* Testing Controls Panel */}
          <ChatTestingPanel
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            vectorSearchLimit={vectorSearchLimit}
            onVectorSearchLimitChange={setVectorSearchLimit}
            systemPrompt={systemPrompt}
            onSystemPromptChange={setSystemPrompt}
            formattingRules={formattingRules}
            onFormattingRulesChange={setFormattingRules}
            lastRequest={lastRequest}
            lastResponse={lastResponse}
            hasUnappliedChanges={hasUnappliedChanges}
            onApplyChanges={handleApplyChanges}
          />

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-6 mb-24">
            {messages.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500 text-sm">Send a message to start testing</p>
              </div>
            )}

            {messages.map((message) => (
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
                        <span className="text-xs font-medium text-gray-700">Jinu ({appliedConfig.model})</span>
                        <span className="text-xs text-gray-400">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && !isStreaming && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Processing...</span>
              </div>
            )}
          </div>

          {/* Fixed Input Area */}
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:ml-72">
            <div className="max-w-7xl mx-auto py-4">
              <div className="page-padding-x flex justify-center">
                <div className="w-[90%] bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
                  <div className="flex items-end gap-2 p-3">
                    <textarea
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      placeholder="Test message..."
                      className="flex-1 max-h-32 px-4 py-3 resize-none focus:outline-none text-sm placeholder-gray-400"
                      rows={1}
                      disabled={isLoading || isStreaming}
                      style={{
                        minHeight: '44px',
                        overflowY: 'hidden'
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading || isStreaming}
                      className={`p-2 rounded-lg transition-colors ${
                        inputMessage.trim() && !isLoading && !isStreaming
                          ? 'bg-gray-700 text-white hover:bg-gray-800'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  <div className="px-7 pb-2 text-xs text-gray-400 flex justify-between items-center">
                    <span>Testing Mode - {selectedModel}</span>
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
      </PageContainer>
    </div>
  );
}
