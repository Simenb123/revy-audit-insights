
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

  return (
    <Card className={cn(
      "flex flex-col",
      embedded ? "h-full border-0 shadow-none" : "w-full max-w-2xl mx-auto h-[600px]"
    )}>
      <CardHeader className={cn("pb-3", embedded && "px-4 py-3")}>
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
