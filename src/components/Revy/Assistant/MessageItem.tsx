
import React from 'react';
import { cn } from '@/lib/utils';
import { RevyMessage } from '@/types/revio';
import RevyAvatar from '../RevyAvatar';
import ActionableMessage from '../ActionableMessage';
import ReactMarkdown from 'react-markdown';
import { Volume2 } from 'lucide-react';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';

interface MessageItemProps {
  message: RevyMessage;
  compact?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, compact = false }) => {
  const isAssistant = message.sender === 'assistant';
  const { speakText } = useVoiceCommands();

  const handleSpeak = () => {
    if (typeof message.content === 'string') {
      speakText(message.content);
    }
  };
  
  return (
    <div
      className={cn(
        "flex animate-fade-in items-start",
        compact ? "gap-2 mb-1" : "gap-2 mb-1.5"
      )}
    >
      {/* Avatar for assistant messages */}
      {isAssistant && (
        <RevyAvatar
          size="md"
          className="flex-shrink-0"
        />
      )}
      
      {/* Avatar for user messages */}
      {!isAssistant && (
        <div
          className={cn(
            "rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium flex-shrink-0",
            compact ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm"
          )}
        >
          D
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "relative rounded-lg break-words before:content-[''] before:absolute before:-left-2 before:top-1/2 before:-translate-y-1/2 before:h-3 before:w-2 before:bg-inherit before:rounded-l-full",
            compact ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5",
            isAssistant
              ? "bg-muted text-foreground"
              : "bg-primary text-primary-foreground"
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

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-1">
          {isAssistant && !compact && (
            <button
              type="button"
              onClick={handleSpeak}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <Volume2 className="h-3 w-3" />
            </button>
          )}
          
          {!isAssistant && !compact && (
            <span className="text-xs text-muted-foreground ml-auto">
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

export default MessageItem;
