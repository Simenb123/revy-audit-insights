
import React from 'react'
import { cn } from '@/lib/utils'
import { RevyMessage } from '@/types/revio'
import RevyAvatar from '../RevyAvatar'
import { Volume2 } from 'lucide-react'
import { useVoiceCommands } from '@/hooks/useVoiceCommands'

interface RevyMessageItemProps {
  message: RevyMessage;
  compact?: boolean;
}

const RevyMessageItem: React.FC<RevyMessageItemProps> = ({ message, compact = false }) => {
  const isAssistant = message.sender === 'assistant'
  const { speakText } = useVoiceCommands()

  const handleSpeak = () => {
    if (typeof message.content === 'string') {
      speakText(message.content)
    }
  }
  
  return (
    <div
      className={cn(
        "flex items-start gap-3",
        compact ? "mb-2" : "mb-3",
        !isAssistant && "flex-row-reverse"
      )}
    >
      {/* Avatar for assistant messages */}
      {isAssistant && (
        <RevyAvatar
          size={compact ? 'md' : 'lg'}
          className="flex-shrink-0 mt-1"
        />
      )}
      
      {/* User avatar for user messages */}
      {!isAssistant && (
        <div className={cn(
          "rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium flex-shrink-0 mt-1",
          compact ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm"
        )}>
          D
        </div>
      )}
      
      {/* Message content */}
      <div className={cn(
        "flex flex-col min-w-0 flex-1",
        !isAssistant && "items-end"
      )}>
        {/* Header with name and timestamp for assistant */}
        {isAssistant && (
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-medium text-foreground">AI-Revy</span>
            {!compact && (
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString('nb-NO', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
          </div>
        )}
        
        {/* Message bubble */}
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm break-words max-w-[85%]',
            compact ? 'text-xs px-2 py-1' : 'text-sm',
            isAssistant ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
          )}
        >
          {message.content}
        </div>
        
        {/* Footer with actions/timestamp */}
        <div className={cn(
          "flex items-center mt-1",
          isAssistant ? "justify-start" : "justify-end"
        )}>
          {isAssistant && !compact && (
            <button
              type="button"
              onClick={handleSpeak}
              className="text-muted-foreground hover:text-foreground mr-2"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
          {!isAssistant && !compact && (
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString('nb-NO', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevyMessageItem;
