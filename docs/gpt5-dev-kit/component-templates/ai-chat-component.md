# AI Chat Component Template

## Prompt for GPT-5 Canvas
```
Lag en AI chat komponent for [beskrivelse av chat formål] i Revio.

TEKNISKE KRAV:
- React 18 + TypeScript
- Integrasjon med Supabase edge function 'revy-ai-chat'
- Real-time meldingshistorikk
- Kontekstbevisst AI (send klient-info, dokument-context etc.)
- Norsk UI og meldinger

CHAT FEATURES:
- Streaming responses fra AI
- Historikk lagring i database
- Typing indicator
- Markdown støtte i AI svar
- File upload support (hvis relevant)
- Kontekstuelle forslag

DESIGN:
- Chat-bobbler design
- Auto-scroll til nyeste melding
- Responsive for mobil/desktop
- Semantiske farger (bg-muted, text-foreground etc.)

CONTEXT DATA:
[Beskriv hvilken kontekst som skal sendes til AI]

Lag komplett chat komponent med message types, hooks og AI integration.
```

## Standard Template
```typescript
// types/chat.ts
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  context?: Record<string, any>;
}

export interface ChatContext {
  client_id?: string;
  document_id?: string;
  action_area?: string;
  [key: string]: any;
}

// hooks/useAIChat.ts
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage, ChatContext } from '../types/chat';

export const useAIChat = (context?: ChatContext) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
        body: {
          message: content,
          context,
          history: messages.slice(-10), // Last 10 messages for context
        },
      });

      if (error) throw error;

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: data.response,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);

      return aiMessage;
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Feil",
        description: "Kunne ikke sende melding til AI",
        variant: "destructive",
      });
    }
  });

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    isTyping,
    sendMessage: sendMessage.mutate,
    isLoading: sendMessage.isPending,
    clearChat,
  };
};

// components/AIChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { useAIChat } from '../hooks/useAIChat';
import { ChatContext } from '../types/chat';

interface AIChatProps {
  context?: ChatContext;
  title?: string;
  placeholder?: string;
  height?: string;
}

const AIChat: React.FC<AIChatProps> = ({ 
  context, 
  title = "AI Assistant",
  placeholder = "Skriv din melding...",
  height = "400px"
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isTyping, sendMessage, isLoading } = useAIChat(context);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage(input);
    setInput('');
  };

  return (
    <Card className="flex flex-col" style={{ height }}>
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString('nb-NO')}
                  </p>
                </div>

                {message.sender === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground">Skriver...</p>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AIChat;
```