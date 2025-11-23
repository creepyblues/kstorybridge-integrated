/**
 * ChatHistorySidebar Component
 *
 * Displays chat session history with ability to load previous sessions
 * Similar design pattern to SavedSearchesSidebar
 */

import { useEffect, useState } from 'react';
import { MessageSquare, Trash2, Plus, Clock } from 'lucide-react';
import { ChatSession, chatHistoryService } from '@/services/chatHistoryService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface ChatHistorySidebarProps {
  userId: string;
  currentSessionId: string | null;
  onLoadSession: (session: ChatSession) => void;
  onNewChat: () => void;
}

export default function ChatHistorySidebar({
  userId,
  currentSessionId,
  onLoadSession,
  onNewChat,
}: ChatHistorySidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const recentSessions = await chatHistoryService.getUserSessions(userId, 20);
      setSessions(recentSessions);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Delete this chat session? This cannot be undone.')) {
      return;
    }

    try {
      const success = await chatHistoryService.deleteSession(sessionId);
      if (success) {
        toast({
          title: 'Session Deleted',
          description: 'The chat session has been removed from your history',
        });
        loadSessions(); // Refresh list

        // If deleted session was active, trigger new chat
        if (sessionId === currentSessionId) {
          onNewChat();
        }
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatSessionTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="w-80 border-l border-gray-300 bg-gray-50 p-6">
        <p className="text-sm text-gray-500">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-gray-300 bg-gray-50 flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-6 border-b border-gray-300">
        <Button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-hanok-teal hover:bg-hanok-teal/90"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {sessions.length > 0 ? (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Clock className="h-4 w-4 text-hanok-teal" />
              Recent Chats
            </h3>
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  onLoad={() => onLoadSession(session)}
                  onDelete={() => handleDeleteSession(session.id)}
                  formatTime={formatSessionTime}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No chat history yet</p>
            <p className="text-xs text-gray-500 mt-1">Start a conversation with Jinu</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Session Item Component
interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onLoad: () => void;
  onDelete: () => void;
  formatTime: (timestamp: string) => string;
}

function SessionItem({ session, isActive, onLoad, onDelete, formatTime }: SessionItemProps) {
  return (
    <div
      className={`p-4 bg-white border rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer ${
        isActive ? 'border-hanok-teal ring-2 ring-hanok-teal/20' : 'border-gray-300'
      }`}
      onClick={onLoad}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className={`h-4 w-4 ${isActive ? 'text-hanok-teal' : 'text-gray-400'}`} />
            <p className={`text-xs font-medium ${isActive ? 'text-hanok-teal' : 'text-gray-500'}`}>
              {formatTime(session.started_at)}
            </p>
          </div>
          <p className={`text-sm font-semibold line-clamp-2 ${
            isActive ? 'text-hanok-teal' : 'text-gray-900 group-hover:text-hanok-teal'
          } transition-colors`}>
            Chat Session
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 hover:bg-red-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
          title="Delete session"
        >
          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className={`px-2 py-0.5 rounded-md ${
          session.session_type === 'openai'
            ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200'
            : 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {session.session_type === 'openai' ? 'GPT-4' : 'Traditional'}
        </span>
        {session.ended_at && (
          <span className="text-gray-400">• Ended</span>
        )}
      </div>
    </div>
  );
}
