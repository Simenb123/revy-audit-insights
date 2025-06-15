
import React from 'react';
import { Loader2 } from 'lucide-react';
import RevyAvatar from '../RevyAvatar';
import { RevyMessage } from '@/types/revio';

interface RevyMessageListProps {
  messages: RevyMessage[];
  isTyping: boolean;
  isEmbedded?: boolean;
}

export const RevyMessageList = ({ messages, isTyping, isEmbedded = false }: RevyMessageListProps) => {
  const userMessageClass = isEmbedded
    ? "bg-blue-100 text-blue-900 p-2 rounded-lg rounded-br-none max-w-[90%] text-sm"
    : "bg-blue-100 text-blue-900 p-3 rounded-2xl rounded-br-none max-w-[85%]";
    
  const revyMessageContainerClass = "flex items-end gap-2";
  const revyMessageClass = isEmbedded
    ? "bg-white border border-gray-200 p-2 rounded-lg rounded-bl-none shadow-sm text-sm"
    : "bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none max-w-[85%] shadow-sm";

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.sender === 'revy' && (
            <div className={`${revyMessageContainerClass} ${isEmbedded ? 'max-w-[90%]' : ''}`}>
              <RevyAvatar size="xs" />
              <div className={revyMessageClass}>
                {msg.content}
              </div>
            </div>
          )}
          
          {msg.sender === 'user' && (
            <div className={userMessageClass}>
              {msg.content}
            </div>
          )}
        </div>
      ))}
      
      {isTyping && (
        <div className="flex justify-start">
          <div className={`${revyMessageContainerClass} ${isEmbedded ? 'max-w-[90%]' : ''}`}>
            <RevyAvatar size="xs" />
            <div className={`${revyMessageClass} flex items-center gap-2`}>
              <Loader2 className={`animate-spin ${isEmbedded ? 'h-3 w-3' : 'h-4 w-4'}`} />
              Analyserer med AI...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
