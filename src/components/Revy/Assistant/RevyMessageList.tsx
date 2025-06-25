
import React from 'react';
import { Brain, User, Loader2 } from 'lucide-react';
import { RevyMessage } from '@/types/revio';
import RevyAvatar from '../RevyAvatar';
import { MessageContentParser } from './MessageContentParser';

interface RevyMessageListProps {
  messages: RevyMessage[];
  isTyping: boolean;
  isEmbedded?: boolean;
  isAnalyzingDocuments?: boolean;
  advanced?: boolean;
}

export const RevyMessageList: React.FC<RevyMessageListProps> = ({
  messages,
  isTyping,
  isEmbedded = false,
  isAnalyzingDocuments = false,
  advanced = false
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div
          key={message.id || index}
          className={`flex ${
            message.sender === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] flex gap-2 ${
              message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              {message.sender === 'user' ? (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              ) : (
                advanced ? (
                  <RevyAvatar size={isEmbedded ? 'xs' : 'sm'} variant="chat" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                )
              )}
            </div>
            <div
              className={
                message.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
              }
            >
              {message.sender === 'user' ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                advanced ? (
                  <MessageContentParser
                    content={message.content as string}
                    isEmbedded={isEmbedded}
                    advanced
                    showDocumentContext={!isEmbedded}
                  />
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )
              )}
              {message.timestamp && (
                <div
                  className={`text-xs mt-1 opacity-70 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString('no-NO', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="flex justify-start">
          <div className="flex gap-2">
            {advanced ? (
              <RevyAvatar size={isEmbedded ? 'xs' : 'sm'} variant="chat" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="chat-bubble-ai flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isAnalyzingDocuments ? 'Analyserer dokumenter...' : 'AI-Revi tenker...'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
