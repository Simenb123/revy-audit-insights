
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RevyMessageList } from './RevyMessageList';
import { RevyMessage } from '@/types/revio';

interface EmbeddedRevyAssistantProps {
  messages: RevyMessage[];
  input: string;
  isLoading: boolean;
  isAnalyzingDocuments?: boolean;
  selectedVariant?: any;
  contextDisplayName?: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
}

const EmbeddedRevyAssistant: React.FC<EmbeddedRevyAssistantProps> = ({
  messages,
  input,
  isLoading,
  isAnalyzingDocuments = false,
  selectedVariant,
  contextDisplayName,
  onInputChange,
  onKeyDown,
  onSendMessage
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Context indicator */}
      {(contextDisplayName || selectedVariant) && (
        <div className="p-3 border-b bg-gray-50 flex-shrink-0">
          <div className="text-xs text-gray-600">
            {contextDisplayName && (
              <span>Kontekst: {contextDisplayName}</span>
            )}
            {selectedVariant && (
              <span className="ml-2">• {selectedVariant.display_name}</span>
            )}
          </div>
        </div>
      )}

      {/* Messages with ScrollArea */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4">
            <RevyMessageList
              messages={messages}
              isTyping={isLoading}
              isAnalyzingDocuments={isAnalyzingDocuments}
              isEmbedded={true}
              advanced
            />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder={isAnalyzingDocuments ? "Analyserer dokumenter..." : "Skriv en melding..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={onSendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedRevyAssistant;
