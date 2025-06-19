
import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Clock, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { RevyMessage } from '@/types/revio';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

interface EnhancedRevyMessageListProps {
  messages: RevyMessage[];
  isTyping: boolean;
  embedded?: boolean;
}

const EnhancedRevyMessageList: React.FC<EnhancedRevyMessageListProps> = ({
  messages,
  isTyping,
  embedded = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const formatMessageContent = (content: string) => {
    // Format lists and bullet points
    const formattedContent = content
      .replace(/^- (.+)$/gm, '• $1')
      .replace(/^(\d+)\. (.+)$/gm, '$1. $2')
      .split('\n')
      .map((line, index) => {
        if (line.trim().startsWith('•')) {
          return <li key={index} className="ml-4">{line.trim().substring(1).trim()}</li>;
        }
        if (/^\d+\./.test(line.trim())) {
          return <li key={index} className="ml-4">{line.trim()}</li>;
        }
        if (line.trim() === '') return <br key={index} />;
        return <p key={index} className="mb-2">{line}</p>;
      });

    return formattedContent;
  };

  const getMessageIcon = (sender: string, metadata?: any) => {
    if (sender === 'user') {
      return <User className="h-4 w-4 text-blue-600" />;
    }
    
    // AI-Revi with different states
    if (metadata?.confidence && metadata.confidence < 0.7) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
    
    return <Bot className="h-4 w-4 text-purple-600" />;
  };

  const getMessageQuality = (metadata?: any) => {
    if (!metadata?.confidence) return null;
    
    const confidence = metadata.confidence;
    if (confidence >= 0.9) return { label: 'Høy sikkerhet', color: 'bg-green-100 text-green-800' };
    if (confidence >= 0.7) return { label: 'Medium sikkerhet', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Lav sikkerhet', color: 'bg-red-100 text-red-800' };
  };

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex items-center justify-center py-8 text-center">
        <div className="space-y-2">
          <Bot className="h-8 w-8 text-purple-600 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Hei! Jeg er AI-Revi, din AI-assistent for revisjon.
          </p>
          <p className="text-xs text-muted-foreground">
            Hvordan kan jeg hjelpe deg i dag?
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {messages.map((message) => {
        const isUser = message.sender === 'user';
        const quality = getMessageQuality(message.metadata);
        
        return (
          <div key={message.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? 'bg-blue-100' : 'bg-purple-100'
            }`}>
              {getMessageIcon(message.sender, message.metadata)}
            </div>

            {/* Message content */}
            <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
              <Card className={`p-3 ${
                isUser ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
              }`}>
                <div className="space-y-2">
                  {/* Message header */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">
                      {isUser ? 'Du' : 'AI-Revi'}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(message.timestamp), { 
                        addSuffix: true, 
                        locale: nb 
                      })}
                    </span>
                  </div>

                  {/* Message content */}
                  <div className={`prose prose-sm max-w-none ${embedded ? 'text-sm' : ''}`}>
                    {formatMessageContent(message.content)}
                  </div>

                  {/* Quality indicator for AI responses */}
                  {!isUser && quality && (
                    <div className="flex justify-end">
                      <Badge className={`text-xs ${quality.color}`}>
                        {quality.label}
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Bot className="h-4 w-4 text-purple-600" />
          </div>
          <Card className="p-3 bg-white border-gray-200">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-muted-foreground">AI-Revi skriver...</span>
            </div>
          </Card>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default EnhancedRevyMessageList;
