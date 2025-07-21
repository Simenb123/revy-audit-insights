
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

interface RevyInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const RevyInput: React.FC<RevyInputProps> = ({
  message,
  setMessage,
  handleSendMessage,
  isTyping,
  placeholder = "Spør AI-Revy om hjelp...",
  onKeyDown
}) => {
  return (
    <div className="flex gap-2 items-center">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="flex-1"
        disabled={isTyping}
      />
      <Button
        onClick={handleSendMessage}
        disabled={!message.trim() || isTyping}
        size="icon"
      >
        {isTyping ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
