
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
  const rootRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

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
  useEffect(() => {
    const updateInputPadding = () => {
      const h = inputContainerRef.current?.offsetHeight ?? 0;
      if (rootRef.current) {
        rootRef.current.style.setProperty('--revy-input-h', `${h}px`);
      }
    };
    updateInputPadding();
    window.addEventListener('resize', updateInputPadding);
    return () => window.removeEventListener('resize', updateInputPadding);
  }, [input, isLoading]);

  return (
    <div ref={rootRef} className="grid h-full min-h-0 grid-rows-[auto_1fr]">
      {/* Context indicator - minimized (only when empty state) */}
      {messages.length === 0 && (
        <div className="px-1 py-0.5">
          <Badge variant="outline" className="text-xs">
            {contextDisplayName}
            {selectedVariant && ` • ${selectedVariant.display_name}`}
          </Badge>
        </div>
      )}

      {/* Messages area - flex-grow with overflow */}
      <div ref={scrollAreaRef} className="relative flex-1 min-h-0 overflow-y-auto">
        <div ref={contentWrapperRef} className="flex min-h-full flex-col justify-end">
          <div className="space-y-0.5 px-1 pb-[var(--revy-input-h,56px)]">
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
        {/* Overlay input anchored to bottom of scroll area */}
        <div
          ref={inputContainerRef}
          className="absolute bottom-0 left-0 right-0 bg-background/95 border-t p-1 flex gap-1 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
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

    </div>
  );
};

export default EmbeddedRevyAssistant;
