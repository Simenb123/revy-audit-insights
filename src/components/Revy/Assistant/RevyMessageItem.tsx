
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
        "flex gap-3",
        compact ? "mb-2" : "mb-4",
        !isAssistant && "flex-row-reverse"
      )}
    >
      
      <div className={cn(
        "flex flex-col min-w-0 flex-1",
        !isAssistant && "items-end"
      )}>
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
        
        <div
          className={cn(
            'revy-message-bubble rounded-lg px-3 py-2 text-sm break-words w-full',
            compact ? 'text-xs' : 'text-sm',
            isAssistant ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
          )}
        >
          {isAssistant && (
            <RevyAvatar
              size={compact ? 'lg' : 'xl'}
              className={cn('revy-message-avatar', compact ? '-top-2 -left-2' : '-top-4 -left-4')}
            />
          )}
          {message.content}
        </div>
        
        <div className="flex items-center justify-between w-full mt-1">
          {isAssistant && !compact && (
            <button
              type="button"
              onClick={handleSpeak}
              className="text-muted-foreground hover:text-foreground"
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
      
      {!isAssistant && (
        <div className={cn(
          "rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium flex-shrink-0",
          compact ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm"
        )}>
          D
        </div>
      )}
    </div>
  );
};

export default RevyMessageItem;
