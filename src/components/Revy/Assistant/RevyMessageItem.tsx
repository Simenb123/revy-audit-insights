
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
    <div className={cn(
      "flex gap-2",
      compact ? "mb-2" : "mb-4",
      !isAssistant && "flex-row-reverse"
    )}>
      {isAssistant && (
        <div className="flex flex-col items-center">
          <RevyAvatar size={compact ? "md" : "lg"} />
          <span className="text-[10px] mt-1">AI-Revy</span>
        </div>
      )}
      
      <div className={cn(
        "flex flex-col",
        "max-w-full",
        !isAssistant && "items-end"
      )}>
        <div className={cn(
          'rounded-lg px-3 py-2 text-sm break-words',
          compact ? 'text-xs' : 'text-sm',
          isAssistant ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
        )}>
          {message.content}
        </div>
        {isAssistant && !compact && (
          <button
            type="button"
            onClick={handleSpeak}
            className="mt-1 text-muted-foreground hover:text-foreground self-start"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        )}
        
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
