
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, MoreHorizontal } from 'lucide-react';
import { RevyMessage } from '@/types/revio';
import MessageItem from './MessageItem';
import { VirtualScrollArea } from '@/components/ui/virtual-scroll-area';

interface RevyMessageListProps {
  messages: RevyMessage[];
  onClearMessages?: () => void;
  compact?: boolean;
  isTyping?: boolean;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  totalMessageCount?: number;
}

/**
 * Displays a list of messages from the Revy assistant.
 *
 * @param {RevyMessageListProps} props - Component props.
 * @param {RevyMessage[]} props.messages - Messages to display.
 * @param {() => void} [props.onClearMessages] - Optional handler to clear all messages.
 * @param {boolean} [props.compact] - Renders a more condensed layout when true.
 * @param {boolean} [props.isTyping] - Shows a typing indicator when true.
 * @returns {JSX.Element} List of messages with optional controls.
 */
export const RevyMessageList: React.FC<RevyMessageListProps> = ({
  messages,
  onClearMessages,
  compact = false,
  isTyping = false,
  hasMoreMessages = false,
  isLoadingMore = false,
  onLoadMore,
  totalMessageCount = 0
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearTop, setIsNearTop] = useState(false);

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (messagesEndRef.current && !showScrollToBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollToBottom]);

  // Handle scroll events for showing scroll-to-bottom button and load more
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    const isAtTop = scrollTop < 100;
    
    setShowScrollToBottom(!isAtBottom && messages.length > 5);
    setIsNearTop(isAtTop);

    // Auto-load more messages when near top
    if (isAtTop && hasMoreMessages && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasMoreMessages, isLoadingMore, onLoadMore, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollToBottom(false);
  };

  const estimatedItemHeight = compact ? 60 : 80;
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="mb-4">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-lg">💬</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Ingen meldinger ennå. Start en samtale!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header with load more and clear button */}
      <div className="flex justify-between items-center p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          {hasMoreMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="h-6 px-2 text-xs"
            >
              {isLoadingMore ? (
                <>
                  <MoreHorizontal className="h-3 w-3 animate-pulse" />
                  Laster...
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 rotate-180" />
                  Last flere
                </>
              )}
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {messages.length}{totalMessageCount > 0 && ` av ${totalMessageCount}`} meldinger
          </span>
        </div>
        {onClearMessages && messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearMessages}
            className="h-6 px-2"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Messages with virtualization */}
      <div className="flex-1 relative">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-auto"
          onScroll={handleScroll}
        >
          <div className="p-2">
            {messages.length > 100 ? (
              <VirtualScrollArea
                items={messages}
                height={600}
                itemHeight={estimatedItemHeight}
                renderItem={(message, index) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    compact={compact}
                  />
                )}
                className="space-y-1"
              />
            ) : (
              <div className="space-y-1">
                {messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    compact={compact}
                  />
                ))}
              </div>
            )}
            {isTyping && (
              <div className="p-2 text-sm text-muted-foreground">Skriver…</div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 z-10 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          >
            <ChevronDown className="h-4 w-4" />
            <span className="ml-1 text-xs">Nyeste</span>
          </Button>
        )}
      </div>
    </div>
  );
};

