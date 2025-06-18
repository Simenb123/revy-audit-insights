
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { RevyContext, RevyChatMessage, RevyMessage } from '@/types/revio';
import KnowledgeStatusIndicator from './KnowledgeStatusIndicator';
import { generateEnhancedAIResponse } from '@/services/revy/enhancedAiInteractionService';
import { useIsMobile } from "@/hooks/use-mobile";
import RevyAvatar from './RevyAvatar';
import { RevyMessageList } from './Assistant/RevyMessageList';

interface SmartReviAssistantProps {
  embedded?: boolean;
  clientData?: any;
  userRole?: string;
}

const SmartReviAssistant = ({ embedded = false, clientData, userRole }: SmartReviAssistantProps) => {
  const [messages, setMessages] = useState<RevyMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
            const loadedMessages: RevyMessage[] = data.map(msg => ({
              id: msg.id,
              sender: msg.sender as 'user' | 'revy',
              content: msg.content,
              timestamp: msg.created_at,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !session?.user?.id) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage: RevyMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    try {
      console.log('🤖 Generating AI response with enhanced knowledge access...');
      
      // Convert messages to chat history format with string content
      const chatHistory = updatedMessages.map(msg => ({
        sender: msg.sender,
        content: typeof msg.content === 'string' ? msg.content : String(msg.content)
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

      // 🔍 ENHANCED DEBUG: Log the AI response in detail
      console.log('🔍 FULL DEBUG: Complete AI response received:');
      console.log('📝 Response text:', aiResponse);
      console.log('📏 Response length:', aiResponse.length);
      console.log('🏷️ Contains emoji:', /🏷️/.test(aiResponse));
      console.log('🔤 Contains EMNER:', /EMNER/i.test(aiResponse));
      console.log('⭐ Contains asterisks:', /\*\*/.test(aiResponse));
      
      // Test multiple tag patterns
      const patterns = [
        /🏷️\s*\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*\s*(.+)/i,
        /🏷️\s*[Ee][Mm][Nn][Ee][Rr]:?\s*(.+)/i,
        /\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*\s*(.+)/i,
        /[Ee][Mm][Nn][Ee][Rr]:\s*(.+)/i
      ];
      
      patterns.forEach((pattern, index) => {
        const match = aiResponse.match(pattern);
        console.log(`🧪 Pattern ${index + 1} match:`, !!match, match ? match[1] : 'no match');
      });

      // Check line by line for debugging
      const lines = aiResponse.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('🏷️') || line.toLowerCase().includes('emner')) {
          console.log(`📍 Line ${index}: "${line}"`);
        }
      });

      const aiMessage: RevyMessage = {
        id: crypto.randomUUID(),
        sender: 'revy',
        content: aiResponse,
        timestamp: new Date().toISOString(),
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
      
      const errorMessage: RevyMessage = {
        id: crypto.randomUUID(),
        sender: 'revy',
        content: 'Beklager, jeg kunne ikke behandle forespørselen din akkurat nå. Vennligst prøv igjen senere.\n\n🏷️ **EMNER:** Feilmeldinger, Support',
        timestamp: new Date().toISOString(),
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
              <h3 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>AI-Revi</h3>
              <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Din smarte revisjonsassistent med tilgang til fagstoff og ISA-standarder
              </p>
            </div>
          </div>
          <div className="mt-2">
            <KnowledgeStatusIndicator />
          </div>
        </div>
        
        {/* Messages - Using the improved RevyMessageList component */}
        <div className="flex-1 min-h-0">
          <RevyMessageList 
            messages={messages} 
            isTyping={isLoading} 
            isEmbedded={true}
          />
        </div>
        
        {/* Input */}
        <div className={`border-t border-border bg-background flex-shrink-0 ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Spør AI-Revi om hjelp..."
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

  // Non-embedded version - also using the improved components
  return (
    <Card className="flex flex-col w-full max-w-2xl mx-auto h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <RevyAvatar />
          <div>
            <CardTitle className="text-lg font-semibold">AI-Revi</CardTitle>
            <p className="text-sm text-muted-foreground">
              Din smarte revisjonsassistent med tilgang til fagstoff og ISA-standarder
            </p>
          </div>
        </div>
        <KnowledgeStatusIndicator />
      </CardHeader>
      <CardContent className="p-0 h-full flex-grow flex flex-col">
        <div className="flex-1 min-h-0">
          <RevyMessageList 
            messages={messages} 
            isTyping={isLoading} 
            isEmbedded={false}
          />
        </div>
        <div className="p-4 border-t flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Spør AI-Revi om hjelp..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-grow"
            />
            <Button 
              type="submit" 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isLoading ? 'Laster...' : 'Send'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartReviAssistant;
