
import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, Loader2, Mic, MicOff } from 'lucide-react';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';

interface RevyInputProps {
  message: string;
  setMessage: (value: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
  isEmbedded?: boolean;
  placeholder?: string;
}

export const RevyInput = ({ 
  message, 
  setMessage, 
  handleSendMessage, 
  isTyping, 
  isEmbedded = false,
  placeholder = "Spør meg om Revio eller revisjon..."
}: RevyInputProps) => {
  const { isRecording, startRecording, stopRecording } = useVoiceCommands();

  const handleVoiceClick = async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text) {
        setMessage((prev) => (prev ? `${prev} ${text}` : text));
      }
    } else {
      await startRecording();
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isTyping) {
        handleSendMessage();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isTyping) {
      handleSendMessage();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`sticky bottom-0 p-2 bg-white border-t ${isEmbedded ? '' : 'p-3'}`}> 
      <div className={`flex gap-1 ${isEmbedded ? '' : 'gap-2'}`}>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 resize-none ${isEmbedded ? 'text-xs h-16 min-h-16' : 'min-h-20'}`}
          disabled={isTyping}
          rows={isEmbedded ? 2 : 3}
        />
        <Button
          type="button"
          onClick={handleVoiceClick}
          size={isEmbedded ? 'sm' : 'icon'}
          variant="outline"
          className={`${isEmbedded ? 'h-16 w-12 px-2' : 'h-20 w-12'}`}
          disabled={isTyping}
        >
          {isRecording ? <MicOff size={isEmbedded ? 12 : 16} /> : <Mic size={isEmbedded ? 12 : 16} />}
        </Button>
        <Button
          type="submit"
          size={isEmbedded ? 'sm' : 'icon'}
          className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shrink-0 ${isEmbedded ? 'h-16 w-12 px-2' : 'h-20 w-12'}`}
          disabled={isTyping || !message.trim()}
        >
          {isTyping ? (
            <Loader2 className={`animate-spin ${isEmbedded ? 'h-3 w-3' : 'h-4 w-4'}`} />
          ) : (
            <SendIcon size={isEmbedded ? 12 : 16} />
          )}
        </Button>
      </div>
    </form>
  );
};
