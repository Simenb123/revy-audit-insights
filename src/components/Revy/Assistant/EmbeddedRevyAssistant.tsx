import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Sparkles } from 'lucide-react';
import { RevyMessageList } from './RevyMessageList';
import { RevyInput } from './RevyInput';
import { RevyMessage } from '@/types/revio';

interface EmbeddedRevyAssistantProps {
  messages: RevyMessage[];
  isTyping: boolean;
  message: string;
  setMessage: (value: string) => void;
  handleSendMessage: () => void;
}

const RevySuggestions = ({ onSuggestionClick }: { onSuggestionClick: (suggestion: string) => void }) => {
  const suggestions = [
    "Hvordan legger jeg til en ny klient?",
    "Hva er ISA 315?",
    "Vis meg revisjonshandlinger for denne klienten",
    "Hvordan bruker jeg Revio effektivt?"
  ];

  return (
    <div className="p-2 border-t bg-gray-50">
      <div className="space-y-1">
        {suggestions.slice(0, 2).map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="text-xs text-blue-600 hover:text-blue-800 block truncate text-left w-full p-1 hover:bg-blue-50 rounded"
          >
            💡 {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export const EmbeddedRevyAssistant = ({ messages, isTyping, message, setMessage, handleSendMessage }: EmbeddedRevyAssistantProps) => {
  const inputProps = { message, setMessage, handleSendMessage, isTyping, isEmbedded: true };

  return (
    <div className="h-full flex flex-col bg-white border rounded-lg overflow-hidden shadow-sm">
      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b flex-shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-gray-800 font-semibold">Revy Assistent</span>
          <Badge variant="secondary" className="text-xs font-medium bg-white">Smart</Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <RevyMessageList messages={messages} isTyping={isTyping} isEmbedded />
      </div>
      
      <div className="flex-shrink-0">
        {messages.length <= 2 && (
          <RevySuggestions onSuggestionClick={setMessage} />
        )}
        <RevyInput {...inputProps} />
      </div>
    </div>
  );
};
