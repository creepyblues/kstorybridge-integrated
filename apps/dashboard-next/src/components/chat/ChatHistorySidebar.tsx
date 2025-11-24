/**
 * ChatHistorySidebar Component
 *
 * Floating sidebar displaying chat session history
 * Unified design pattern across Chat, Comps Navigator, and Mandates pages
 */

import { useEffect, useState, useCallback } from 'react';
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

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const recentSessions = await chatHistoryService.getUserSessions(userId, 20);
      setSessions(recentSessions);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]); // Dependencies: userId

  useEffect(() => {
    loadSessions();
  }, [loadSessions]); // Now stable via useCallback

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
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-hanok-teal/5 to-hanok-teal/10 border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-hanok-teal/10 p-2 rounded-lg">
            <MessageSquare className="h-5 w-5 text-hanok-teal" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Chat History</h2>
            <p className="text-xs text-gray-600">Recent conversations</p>
          </div>
        </div>

        {/* New Chat Button */}
        <Button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-hanok-teal hover:bg-hanok-teal/90 h-10 text-sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List - Scrollable */}
      <div className="overflow-y-auto px-6 py-4 scrollbar-hide max-h-[50vh]">
        {sessions.length > 0 ? (
          <div className="space-y-2">
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="bg-gray-100 rounded-full p-4 mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">No chat history</p>
            <p className="text-xs text-gray-500">Start a conversation with Jinu</p>
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
      className={`relative group p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-hanok-teal/5 border-hanok-teal shadow-sm'
          : 'bg-white border-gray-200 hover:border-hanok-teal/50 hover:shadow-sm'
      }`}
      onClick={onLoad}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock className={`h-3 w-3 flex-shrink-0 ${isActive ? 'text-hanok-teal' : 'text-gray-400'}`} />
            <p className={`text-xs font-medium ${isActive ? 'text-hanok-teal' : 'text-gray-500'}`}>
              {formatTime(session.started_at)}
            </p>
          </div>
          <p className={`text-sm font-medium truncate ${
            isActive ? 'text-hanok-teal' : 'text-gray-900'
          }`}>
            Chat Session
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
          title="Delete session"
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-600" />
        </button>
      </div>
    </div>
  );
}
