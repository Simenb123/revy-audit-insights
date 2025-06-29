
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { RevyMessage } from '@/types/revio';
import RevyMessageItem from './RevyMessageItem';

interface RevyMessageListProps {
  messages: RevyMessage[];
  onClearMessages?: () => void;
  compact?: boolean;
  isTyping?: boolean;
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
  isTyping = false
}) => {
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
    <div className="flex flex-col h-full">
      {/* Header with clear button */}
      {onClearMessages && messages.length > 0 && (
        <div className="flex justify-between items-center p-2 border-b">
          <span className="text-xs text-muted-foreground">
            {messages.length} meldinger
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearMessages}
            className="h-6 px-2"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {messages.map((message) => (
            <RevyMessageItem
              key={message.id}
              message={message}
              compact={compact}
            />
          ))}
          {isTyping && (
            <div className="p-2 text-sm text-muted-foreground">Skriver…</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

