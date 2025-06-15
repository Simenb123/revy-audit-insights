
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertCircle } from 'lucide-react';
import { RevyMessageList } from './RevyMessageList';
import { RevyInput } from './RevyInput';
import { RevyMessage } from '@/types/revio';

interface EmbeddedRevyAssistantProps {
  currentTip: string;
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

export const EmbeddedRevyAssistant = ({ currentTip, messages, isTyping, message, setMessage, handleSendMessage }: EmbeddedRevyAssistantProps) => {
  const inputProps = { message, setMessage, handleSendMessage, isTyping, isEmbedded: true };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles className="h-3 w-3 text-blue-500" />
          <span className="text-blue-700 font-medium">AI Oppgradert</span>
          <Badge variant="secondary" className="text-xs">Smart kontekst</Badge>
        </div>
      </div>

      {currentTip && (
        <div className="p-2 bg-blue-50 border-b">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">{currentTip}</p>
          </div>
        </div>
      )}

      <RevyMessageList messages={messages} isTyping={isTyping} isEmbedded />
      
      {messages.length <= 2 && (
        <RevySuggestions onSuggestionClick={setMessage} />
      )}
      
      <RevyInput {...inputProps} />
    </div>
  );
};
