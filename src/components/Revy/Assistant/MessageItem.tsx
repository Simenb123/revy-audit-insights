
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
      "flex gap-2 animate-fade-in",
      compact ? "mb-2" : "mb-4",
      !isAssistant && "flex-row-reverse"
    )}>
      {isAssistant && (
        <RevyAvatar size={compact ? "sm" : "md"} />
      )}
      
      <div className={cn(
        "flex flex-col",
        "max-w-full",
        !isAssistant && "items-end"
      )}>
        <div className={cn(
          "rounded-lg px-3 py-2 text-sm break-words",
          compact ? "text-xs" : "text-sm",
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
            <ReactMarkdown className="prose prose-sm max-w-none">
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
      
      {!isAssistant && (
        <div className={cn(
          "rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium",
          compact ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm"
        )}>
          D
        </div>
      )}
    </div>
  );
};

export default MessageItem;
