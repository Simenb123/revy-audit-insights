
import React from 'react';
import { RevyMessage } from '@/types/revio';
import { MessageContentParser } from './MessageContentParser';
import RevyAvatar from '../RevyAvatar';
import { User } from 'lucide-react';

interface RevyMessageItemProps {
  message: RevyMessage;
  isLast?: boolean;
}

const RevyMessageItem = ({ message, isLast = false }: RevyMessageItemProps) => {
  const isAssistant = message.sender === 'assistant';
  
  return (
    <div className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'} ${isLast ? 'mb-0' : 'mb-4'}`}>
      {isAssistant && (
        <div className="flex-shrink-0 self-start">
          <RevyAvatar size="sm" variant="chat" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${isAssistant ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isAssistant
              ? 'bg-white border border-gray-200 shadow-sm'
              : 'bg-blue-600 text-white ml-auto'
          }`}
        >
          {isAssistant ? (
            <MessageContentParser content={message.content} />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        
        <div className={`text-xs text-gray-500 mt-1 ${isAssistant ? 'text-left' : 'text-right'}`}>
          {message.timestamp.toLocaleTimeString('no-NO', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      
      {!isAssistant && (
        <div className="flex-shrink-0 self-start order-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default RevyMessageItem;
