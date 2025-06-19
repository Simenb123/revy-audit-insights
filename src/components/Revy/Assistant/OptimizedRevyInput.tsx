
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, MicOff, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OptimizedRevyInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
  isEmbedded?: boolean;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

const OptimizedRevyInput: React.FC<OptimizedRevyInputProps> = ({
  message,
  setMessage,
  handleSendMessage,
  isTyping,
  isEmbedded = false,
  placeholder = "Spør AI-Revi...",
  suggestions = [],
  onSuggestionClick
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isTyping) {
        handleSendMessage();
      }
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setMessage(suggestion);
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick suggestions */}
      {suggestions.length > 0 && message.length === 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lightbulb className="h-3 w-3" />
            <span>Forslag:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, isEmbedded ? 2 : 4).map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-purple-50 text-xs px-2 py-1"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                {suggestion.length > 40 ? `${suggestion.substring(0, 40)}...` : suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isTyping}
            className={`resize-none pr-12 ${isEmbedded ? 'min-h-[60px] max-h-[120px]' : 'min-h-[80px] max-h-[200px]'}`}
            rows={isEmbedded ? 2 : 3}
          />
          
          {/* Voice input button (placeholder for future implementation) */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-2 bottom-2 h-8 w-8 p-0"
            onClick={() => setIsRecording(!isRecording)}
            disabled={isTyping}
            title="Stemmeopptak (kommer snart)"
          >
            {isRecording ? (
              <MicOff className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>

        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || isTyping}
          size={isEmbedded ? "sm" : "default"}
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Character count for longer messages */}
      {message.length > 100 && (
        <div className="text-xs text-muted-foreground text-right">
          {message.length}/2000 tegn
        </div>
      )}
    </div>
  );
};

export default OptimizedRevyInput;
