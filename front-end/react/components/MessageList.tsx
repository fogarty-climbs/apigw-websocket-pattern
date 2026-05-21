import { forwardRef } from 'react';
import { ChatMessage } from '../hooks/useChat';

interface MessageListProps {
  messages: ChatMessage[];
  displayName: string;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * MessageList — scrollable message feed.
 * Uses forwardRef so the parent can control scroll position.
 * Equivalent to the #messageContainer + *ngFor block in chat.html
 */
const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, displayName }, ref) => {
    return (
      <div ref={ref} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex flex-col ${
              message.system ? 'items-center' : message.self ? 'items-end' : 'items-start'
            }`}
          >
            {message.system ? (
              <span className="text-xs text-gray-500 italic px-3 py-1 bg-gray-800 rounded-full">
                {message.content}
              </span>
            ) : (
              <>
                <span className="text-xs text-gray-500 mb-1 font-mono">
                  {message.self ? displayName : message.displayName}
                </span>
                <div
                  className={`px-4 py-2 rounded-2xl text-sm max-w-xs leading-relaxed ${
                    message.self
                      ? 'bg-green-500 text-white rounded-tr-sm'
                      : 'bg-gray-800 text-gray-200 rounded-tl-sm'
                  }`}
                >
                  {message.content}
                </div>
                <span className="text-xs text-gray-600 mt-1">
                  {timeAgo(message.timestamp)}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';
export default MessageList;
