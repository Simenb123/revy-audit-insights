
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
    ? "bg-blue-100 text-blue-900 p-2.5 rounded-lg rounded-br-none max-w-[90%] text-sm leading-relaxed"
    : "bg-blue-100 text-blue-900 p-3 rounded-2xl rounded-br-none max-w-[85%] leading-relaxed";
    
  const revyMessageContainerClass = "flex items-start gap-2.5";
  const revyMessageClass = isEmbedded
    ? "bg-white border border-gray-200 p-2.5 rounded-lg rounded-bl-none shadow-sm text-sm"
    : "bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none max-w-[85%] shadow-sm";

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-gray-50/50">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.sender === 'revy' && (
            <div className={`${revyMessageContainerClass} ${isEmbedded ? 'max-w-[90%]' : 'max-w-[85%]'}`}>
              <RevyAvatar size={isEmbedded ? 'xs' : 'sm'} className="flex-shrink-0" />
              <div className={`${revyMessageClass} prose prose-sm max-w-none leading-relaxed`}>
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
          <div className={`${revyMessageContainerClass} ${isEmbedded ? 'max-w-[90%]' : 'max-w-[85%]'}`}>
            <RevyAvatar size={isEmbedded ? 'xs' : 'sm'} className="flex-shrink-0" />
            <div className={`${revyMessageClass} flex items-center gap-2 text-muted-foreground`}>
              <Loader2 className={`animate-spin ${isEmbedded ? 'h-4 w-4' : 'h-4 w-4'}`} />
              Analyserer...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
