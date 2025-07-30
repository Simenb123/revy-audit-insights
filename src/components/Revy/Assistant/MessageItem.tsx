
import React from 'react';
import { cn } from '@/lib/utils';
import { RevyMessage } from '@/types/revio';
import RevyAvatar from '../RevyAvatar';
import ActionableMessage from '../ActionableMessage';
import ReactMarkdown from 'react-markdown';

interface MessageItemProps {
  message: RevyMessage;
  compact?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, compact = false }) => {
  const isAssistant = message.sender === 'assistant';
  
  return (
    <div
      className={cn(
        "flex animate-fade-in items-start",
        compact ? "gap-2 mb-2" : "gap-3 mb-4",
        !isAssistant && "flex-row-reverse"
      )}
    >
      {/* Avatar for assistant messages */}
      {isAssistant && (
        <RevyAvatar
          size={compact ? "md" : "lg"}
          className="flex-shrink-0 mt-0.5"
        />
      )}
      
      {/* Avatar for user messages */}
      {!isAssistant && (
        <div
          className={cn(
            "rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium mt-0.5 flex-shrink-0",
            compact ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm"
          )}
        >
          D
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "rounded-lg break-words",
            compact ? "text-xs px-2 py-1.5" : "text-sm px-3 py-2",
            isAssistant
              ? "bg-muted text-foreground shadow-sm"
              : "bg-primary text-primary-foreground"
          )}
        >
          {isAssistant ? (
            <ActionableMessage
              content={typeof message.content === 'string' ? message.content : ''}
              links={message.links || []}
              sources={message.sources || []}
            />
          ) : (
            <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
              {typeof message.content === 'string' ? message.content : ''}
            </ReactMarkdown>
          )}
        </div>

        {!compact && (
          <span className="text-xs text-muted-foreground mt-1 block">
            {message.timestamp.toLocaleTimeString('nb-NO', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
