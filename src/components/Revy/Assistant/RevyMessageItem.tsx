
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
        "flex items-start gap-2",
        compact ? "mb-1" : "mb-2"
      )}
    >
      {/* Avatar for assistant messages */}
      {isAssistant && (
        <RevyAvatar
          size="lg"
          className="flex-shrink-0"
        />
      )}
      
      {/* User avatar for user messages */}
      {!isAssistant && (
        <div className={cn(
          "rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium flex-shrink-0",
          compact ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm"
        )}>
          D
        </div>
      )}
      
      {/* Message content with integrated layout */}
      <div className="min-w-0 flex-1">
        {/* Message bubble with header */}
        <div
          className={cn(
            'rounded-lg break-words',
            compact ? 'text-xs px-2 py-1.5' : 'text-sm px-3 py-2',
            isAssistant ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
          )}
        >
          {/* Header for assistant messages */}
          {isAssistant && !compact && (
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium opacity-70">AI-Revy</span>
              <span className="text-xs opacity-60">
                {message.timestamp.toLocaleTimeString('nb-NO', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}
          
          {/* Message content */}
          <div>{message.content}</div>
        </div>
        
        {/* Footer with actions for assistant */}
        {isAssistant && !compact && (
          <div className="flex items-center mt-1">
            <button
              type="button"
              onClick={handleSpeak}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <Volume2 className="h-3 w-3" />
            </button>
          </div>
        )}
        
        {/* Timestamp for user messages */}
        {!isAssistant && !compact && (
          <div className="flex justify-end mt-1">
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString('nb-NO', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevyMessageItem;
