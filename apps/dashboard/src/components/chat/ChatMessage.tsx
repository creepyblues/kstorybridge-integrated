import { Icon } from '@iconify/react';
import { Card } from '@/components/ui/card';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  };
  isLatest?: boolean;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="bg-hanok-teal/10 rounded-full p-2">
            <Icon icon="solar:robot-bold-duotone" className="h-5 w-5 text-hanok-teal" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <Card
          className={`p-4 ${
            isUser
              ? 'bg-hanok-teal text-white border-hanok-teal'
              : 'bg-transparent border-gray-300'
          }`}
        >
          <div className={`text-sm whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800'}`}>
            {message.content}
          </div>
        </Card>

        {/* Timestamp */}
        {message.timestamp && (
          <span className="text-xs text-gray-400 mt-1 px-2">
            {message.timestamp.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>

      {/* Avatar (User) */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="bg-gray-200 rounded-full p-2">
            <Icon icon="solar:user-bold-duotone" className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
}
