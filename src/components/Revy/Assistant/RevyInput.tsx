
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon, Loader2 } from 'lucide-react';

interface RevyInputProps {
  message: string;
  setMessage: (value: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
  isEmbedded?: boolean;
}

export const RevyInput = ({ message, setMessage, handleSendMessage, isTyping, isEmbedded = false }: RevyInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`p-2 bg-white border-t ${isEmbedded ? '' : 'p-3'}`}>
      <div className={`flex gap-1 ${isEmbedded ? '' : 'gap-2'}`}>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Spør meg om Revio eller revisjon..."
          className={isEmbedded ? 'flex-1 text-xs h-8' : 'flex-1'}
          disabled={isTyping}
        />
        <Button 
          size={isEmbedded ? 'sm' : 'icon'}
          onClick={handleSendMessage} 
          className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 ${isEmbedded ? 'h-8 w-8 p-0' : ''}`}
          disabled={isTyping || !message.trim()}
        >
          {isTyping ? (
            <Loader2 className={`animate-spin ${isEmbedded ? 'h-3 w-3' : 'h-4 w-4'}`} />
          ) : (
            <SendIcon size={isEmbedded ? 12 : 16} />
          )}
        </Button>
      </div>
    </div>
  );
};
