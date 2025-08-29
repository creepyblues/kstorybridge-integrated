import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@kstorybridge/ui";
import { useAuth } from "@/hooks/useAuth";
import { chatHistoryService, type ChatSession, type ChatMessage, type ChatInteraction } from "@/services/chatHistoryService";
import { MessageSquare, Clock, MousePointer, Eye, TrendingUp, Database } from "lucide-react";

export default function ChatHistory() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [sessionInteractions, setSessionInteractions] = useState<ChatInteraction[]>([]);
  const [stats, setStats] = useState<{
    totalSessions: number;
    totalMessages: number;
    totalTitleClicks: number;
    averageSessionLength: number;
    mostRecommendedTitles: { title_id: string; title_name_en?: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadChatHistory();
      loadStats();
    }
  }, [user]);

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userSessions = await chatHistoryService.getUserSessions(user.id, 20);
      setSessions(userSessions);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const userStats = await chatHistoryService.getUserChatStats(user.id);
      setStats(userStats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadSessionDetails = async (session: ChatSession) => {
    try {
      setSelectedSession(session);
      const [messages, interactions] = await Promise.all([
        chatHistoryService.getSessionMessages(session.id),
        chatHistoryService.getSessionInteractions(session.id)
      ]);
      
      setSessionMessages(messages);
      setSessionInteractions(interactions);
    } catch (error) {
      console.error("Failed to load session details:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getSessionDuration = (session: ChatSession) => {
    if (!session.ended_at) return "Active";
    
    const start = new Date(session.started_at);
    const end = new Date(session.ended_at);
    const duration = end.getTime() - start.getTime();
    const minutes = Math.floor(duration / 60000);
    
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-gray-600">Loading chat history...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-midnight-ink mb-2">
            📊 Chat History & Analytics
          </h1>
          <p className="text-gray-600">
            View your OpenAI chatbot conversation history and interaction analytics
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Messages</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MousePointer className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Title Clicks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTitleClicks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Session</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageSessionLength} min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sessions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {sessions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No chat sessions found. Start a conversation in the OpenAI chatbot to see history here.
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedSession?.id === session.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => loadSessionDetails(session)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">
                            {session.session_type === 'openai' ? '🧠 OpenAI Chat' : '🤖 AI Chat'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(session.started_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {getSessionDuration(session)}
                          </p>
                          <p className={`text-xs px-2 py-1 rounded-full ${
                            session.ended_at ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {session.ended_at ? 'Ended' : 'Active'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {selectedSession ? 'Session Details' : 'Select a Session'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedSession ? (
                <div className="text-center text-gray-500 py-8">
                  Select a chat session from the left to view its details
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Session Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Session Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Started:</span>
                        <p className="font-medium">{formatDate(selectedSession.started_at)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <p className="font-medium">{getSessionDuration(selectedSession)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Messages:</span>
                        <p className="font-medium">{sessionMessages.length}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Interactions:</span>
                        <p className="font-medium">{sessionInteractions.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Messages */}
                  <div>
                    <h4 className="font-semibold mb-2">Messages Preview</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {sessionMessages.slice(0, 5).map((message) => (
                        <div key={message.id} className="bg-gray-50 rounded p-2">
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              message.message_type === 'user_prompt' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {message.message_type === 'user_prompt' ? 'User' : 'AI'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {message.content.substring(0, 100)}
                            {message.content.length > 100 ? '...' : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactions */}
                  <div>
                    <h4 className="font-semibold mb-2">User Interactions</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {sessionInteractions.length === 0 ? (
                        <p className="text-sm text-gray-500">No interactions recorded</p>
                      ) : (
                        sessionInteractions.map((interaction) => (
                          <div key={interaction.id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                interaction.interaction_type === 'title_click' ? 'bg-blue-500' :
                                interaction.interaction_type === 'suggestion_click' ? 'bg-green-500' :
                                interaction.interaction_type === 'title_view' ? 'bg-purple-500' :
                                'bg-gray-500'
                              }`} />
                              <span className="capitalize">
                                {interaction.interaction_type.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-gray-500 text-xs">
                              {formatDate(interaction.created_at)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button onClick={loadChatHistory} variant="outline">
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
}