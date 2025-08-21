
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';
import { Send, Loader2 } from 'lucide-react';
import { RevyMessage } from '@/types/revio';
import MessageItem from './MessageItem';

interface EmbeddedRevyAssistantProps {
  messages: RevyMessage[];
  input: string;
  isLoading: boolean;
  selectedVariant?: any;
  contextDisplayName: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
}

const EmbeddedRevyAssistant: React.FC<EmbeddedRevyAssistantProps> = ({
  messages,
  input,
  isLoading,
  selectedVariant,
  contextDisplayName,
  onInputChange,
  onKeyDown,
  onSendMessage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, isLoading]);

  useEffect(() => {
    const container = scrollAreaRef.current;
    const wrapper = contentWrapperRef.current;
    if (!container || !wrapper) return;
    // Temporary layout diagnostics
    console.log('EmbeddedRevyAssistant sizes', {
      containerH: container.clientHeight,
      wrapperH: wrapper.clientHeight,
      messages: messages.length,
    });
  }, [messages, isLoading]);
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Context indicator - minimized (only when empty state) */}
      {messages.length === 0 && (
        <div className="flex-shrink-0 px-1 py-0.5">
          <Badge variant="outline" className="text-xs">
            {contextDisplayName}
            {selectedVariant && ` • ${selectedVariant.display_name}`}
          </Badge>
        </div>
      )}

      {/* Messages area - flex-1 with overflow */}
      <div ref={scrollAreaRef} className="flex-1 min-h-0 overflow-y-auto">
        <div ref={contentWrapperRef} className="flex flex-col h-full">
          <div className="flex-1"></div>
          <div className="space-y-0.5 px-1 pb-4">
            {messages.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2 text-center">
                Spør meg om hjelp med revisjonen
              </div>
            ) : (
              messages.map((message) => (
                <MessageItem 
                  key={message.id} 
                  message={message} 
                  compact={true}
                />
              ))
            )}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                AI-Revy tenker...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      {/* Input area - fixed at bottom with flexbox */}
      <div className="flex-shrink-0 bg-background border-t p-1 flex gap-1">
        <Input
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder="Spør AI-Revy..."
          disabled={isLoading}
          className="text-sm"
        />
        <Button 
          onClick={onSendMessage} 
          disabled={!input.trim() || isLoading}
          size="sm"
          className="px-2"
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>

    </div>
  );
};

export default EmbeddedRevyAssistant;
