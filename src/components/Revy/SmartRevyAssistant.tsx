import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { RevyContext, RevyChatMessage } from '@/types/revio';
import KnowledgeStatusIndicator from './KnowledgeStatusIndicator';
import { generateEnhancedAIResponse } from '@/services/revy/enhancedAiInteractionService';
import { useIsMobile } from "@/hooks/use-mobile";
import RevyAvatar from './RevyAvatar';

// Internal message type for UI display
interface UIMessage {
  id: string;
  sender: 'user' | 'revy';
  content: string;
  timestamp: Date;
}

interface SmartRevyAssistantProps {
  embedded?: boolean;
  clientData?: any;
  userRole?: string;
}

const SmartRevyAssistant = ({ embedded = false, clientData, userRole }: SmartRevyAssistantProps) => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { session } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const context: RevyContext = 'general';
  const isMobile = useIsMobile();

  useEffect(() => {
    const generateSessionId = async () => {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      console.log('💬 New session ID generated:', newSessionId);
    };

    if (!sessionId) {
      generateSessionId();
    }
  }, [sessionId]);

  useEffect(() => {
    // Load previous messages from session
    const loadPreviousMessages = async () => {
      if (sessionId && session?.user?.id) {
        try {
          const { data, error } = await supabase
            .from('revy_chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

          if (error) {
            console.error('Error loading messages:', error);
          } else if (data) {
            const loadedMessages: UIMessage[] = data.map(msg => ({
              id: msg.id,
              sender: msg.sender as 'user' | 'revy',
              content: msg.content,
              timestamp: new Date(msg.created_at),
            }));
            setMessages(loadedMessages);
            console.log(`💬 Loaded ${loadedMessages.length} previous messages from session ${sessionId}`);
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      }
    };

    loadPreviousMessages();
  }, [sessionId, session?.user?.id]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !session?.user?.id) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage: UIMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    try {
      console.log('🤖 Generating AI response with enhanced knowledge access...');
      
      // Convert UI messages to chat history format
      const chatHistory = updatedMessages.map(msg => ({
        sender: msg.sender,
        content: msg.content
      }));

      // Use enhanced AI service for better knowledge base access
      const aiResponse = await generateEnhancedAIResponse(
        userMessage,
        context,
        chatHistory,
        clientData,
        userRole,
        sessionId
      );

      const aiMessage: UIMessage = {
        id: crypto.randomUUID(),
        sender: 'revy',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save messages to session
      if (sessionId) {
        try {
          await supabase.from('revy_chat_messages').insert([
            { session_id: sessionId, sender: 'user', content: userMessage },
            { session_id: sessionId, sender: 'revy', content: aiResponse }
          ]);
        } catch (error) {
          console.error('Error saving messages:', error);
        }
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: UIMessage = {
        id: crypto.randomUUID(),
        sender: 'revy',
        content: 'Beklager, jeg kunne ikke behandle forespørselen din akkurat nå. Vennligst prøv igjen senere.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (embedded) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className={`border-b border-border flex-shrink-0 ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center gap-3">
            <RevyAvatar />
            <div className="min-w-0 flex-1">
              <h3 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>AI-Revy</h3>
              <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Din smarte revisjonsassistent med tilgang til fagstoff og ISA-standarder
              </p>
            </div>
          </div>
          <div className="mt-2">
            <KnowledgeStatusIndicator />
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div ref={chatContainerRef} className={`space-y-4 ${isMobile ? 'p-3' : 'p-4'}`}>
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <RevyAvatar className="mx-auto mb-4" />
                  <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                    Hei! Jeg er AI-Revy. Spør meg om revisjon, ISA-standarder eller andre faglige spørsmål.
                  </p>
                </div>
              )}
              
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.sender === 'revy' && <RevyAvatar className="flex-shrink-0" />}
                  <div className={`flex-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                    <div className={cn(
                      "inline-block p-3 rounded-lg text-sm break-words max-w-[85%]",
                      msg.sender === 'user' 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-muted"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <RevyAvatar className="flex-shrink-0" />
                  <div className="bg-muted p-3 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Input */}
        <div className={`border-t border-border bg-background flex-shrink-0 ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Spør AI-Revy om hjelp..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className={`flex-grow ${isMobile ? 'text-sm h-10' : ''}`}
            />
            <Button 
              type="submit" 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
              size={isMobile ? 'sm' : 'default'}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? (
                <Loader2 className={`animate-spin ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              ) : (
                <Send className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Non-embedded version remains the same
  return (
    <Card className="flex flex-col w-full max-w-2xl mx-auto h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <RevyAvatar />
          <div>
            <CardTitle className="text-lg font-semibold">AI-Revy</CardTitle>
            <p className="text-sm text-muted-foreground">
              Din smarte revisjonsassistent med tilgang til fagstoff og ISA-standarder
            </p>
          </div>
        </div>
        <KnowledgeStatusIndicator />
      </CardHeader>
      <CardContent className="p-4 h-full flex-grow">
        <div ref={chatContainerRef} className="chat-container overflow-y-auto h-[400px] pr-2">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}>
              {msg.sender === 'revy' && <RevyAvatar className="mr-2" />}
              <div className="message-content">
                <p className="text-sm break-words">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message ai-message">
              <RevyAvatar className="mr-2" />
              <div className="message-content">
                <p className="text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Spør AI-Revy om hjelp..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-grow"
          />
          <Button type="submit" onClick={handleSendMessage} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isLoading ? 'Laster...' : 'Send'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

function RevyAvatar(props: any) {
  return (
    <Avatar {...props}>
      <AvatarImage src="/revy-avatar.png" alt="AI Revy" />
      <AvatarFallback>AI</AvatarFallback>
    </Avatar>
  )
}

export default SmartRevyAssistant;
