
import React from 'react';
import { cn } from '@/lib/utils';
import { RevyMessage } from '@/types/revio';
import RevyAvatar from '../RevyAvatar';

interface RevyMessageItemProps {
  message: RevyMessage;
  compact?: boolean;
}

const RevyMessageItem: React.FC<RevyMessageItemProps> = ({ message, compact = false }) => {
  const isAssistant = message.sender === 'assistant';
  
  return (
    <div className={cn(
      "flex gap-2",
      compact ? "mb-2" : "mb-4",
      !isAssistant && "flex-row-reverse"
    )}>
      {isAssistant && (
        <RevyAvatar size={compact ? "sm" : "md"} />
      )}
      
      <div className={cn(
        "flex flex-col",
        compact ? "max-w-[85%]" : "max-w-[80%]",
        !isAssistant && "items-end"
      )}>
        <div className={cn(
          "rounded-lg px-3 py-2 text-sm break-words",
          compact ? "text-xs" : "text-sm",
          isAssistant 
            ? "bg-muted text-foreground" 
            : "bg-primary text-primary-foreground"
        )}>
          {message.content}
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

export default RevyMessageItem;
