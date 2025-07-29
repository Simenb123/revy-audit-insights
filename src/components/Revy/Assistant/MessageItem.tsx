
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
    <div className={cn(
      "grid animate-fade-in",
      compact ? "grid-cols-[auto_1fr] gap-1 mb-1" : "grid-cols-[auto_1fr] gap-3 mb-4"
    )}>
      {isAssistant ? (
        <RevyAvatar 
          size={compact ? "md" : "xl"} 
          className="mt-1" 
        />
      ) : (
        <div className={cn(
          "rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium mt-1",
          compact ? "h-8 w-8 text-xs" : "h-12 w-12 text-sm"
        )}>
          D
        </div>
      )}
      
      <div className="min-w-0">
        <div className={cn(
          "rounded-lg px-4 py-3 break-words",
          compact ? "text-xs px-3 py-2" : "text-sm",
          isAssistant 
            ? "bg-muted text-foreground shadow-sm" 
            : "bg-primary text-primary-foreground"
        )}>
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
          <span className="text-xs text-muted-foreground mt-1">
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
