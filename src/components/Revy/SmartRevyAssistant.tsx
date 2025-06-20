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
import { generateEnhancedAIResponseWithVariant } from '@/services/revy/enhancedAiInteractionService';
import { useIsMobile } from "@/hooks/use-mobile";
import RevyAvatar from './RevyAvatar';
import { RevyMessageList } from './Assistant/RevyMessageList';

interface SmartReviAssistantProps {
  embedded?: boolean;
  clientData?: any;
  userRole?: string;
  context?: RevyContext;
  selectedVariant?: any;
  onContextChange?: (context: RevyContext) => void;
}

const SmartReviAssistant = ({ 
  embedded = false, 
  clientData, 
  userRole,
  context = 'general',
  selectedVariant,
  onContextChange
}: SmartReviAssistantProps) => {
  const [messages, setMessages] = useState<RevyMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Use context from props instead of hardcoded 'general'
  const currentContext = context;

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
    // Load previous messages from session or add welcome message
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
          } else if (data && data.length > 0) {
            const loadedMessages: RevyMessage[] = data.map(msg => ({
              id: msg.id,
              sender: msg.sender as 'user' | 'revy',
              content: msg.content,
              timestamp: msg.created_at,
            }));
            setMessages(loadedMessages);
            console.log(`💬 Loaded ${loadedMessages.length} previous messages from session ${sessionId}`);
          } else {
            // Add welcome message for new sessions
            const welcomeMessage = getContextualWelcomeMessage(currentContext, clientData);
            const welcomeMsg: RevyMessage = {
              id: crypto.randomUUID(),
              sender: 'revy',
              content: welcomeMessage,
              timestamp: new Date().toISOString(),
            };
            setMessages([welcomeMsg]);
            
            // Save welcome message to database
            try {
              await supabase.from('revy_chat_messages').insert({
                session_id: sessionId,
                sender: 'revy',
                content: welcomeMessage
              });
            } catch (saveError) {
              console.error('Error saving welcome message:', saveError);
            }
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      }
    };

    loadPreviousMessages();
  }, [sessionId, session?.user?.id, currentContext, clientData]);

  // Add context change effect to show visual feedback
  useEffect(() => {
    if (embedded && onContextChange) {
      console.log(`🔄 AI-Revi context changed to: ${currentContext}${selectedVariant ? ` with variant: ${selectedVariant.name}` : ''}`);
    }
  }, [currentContext, selectedVariant, embedded, onContextChange]);

  // Function to get contextual welcome message with enhanced client data
  const getContextualWelcomeMessage = (ctx: RevyContext, client?: any) => {
    const clientName = client?.company_name || client?.name || 'klienten';
    const docCount = client?.documentSummary?.totalDocuments || 0;
    const categories = client?.documentSummary?.categories || [];
    const recentDocs = client?.documentSummary?.recentDocuments || [];
    
    switch (ctx) {
      case 'client-detail':
        return `Hei! Jeg er AI-Revi, din smarte revisjonsassistent. Jeg kan hjelpe deg med analyse av ${clientName}.

📊 **KLIENTOVERSIKT:**
- ${docCount} dokumenter tilgjengelig
- Kategorier: ${categories.length > 0 ? categories.join(', ') : 'Ingen kategorier ennå'}
- Siste dokumenter: ${recentDocs.length > 0 ? recentDocs.map(d => d.name).join(', ') : 'Ingen dokumenter ennå'}

Jeg kan hjelpe deg med klientanalyse, dokumentgjennomgang, risikovurdering og revisjonsplanlegging. Hva vil du vite om denne klienten?

🏷️ **EMNER:** Klientanalyse, Dokumenter, Risikovurdering, Revisjonsplanlegging`;
        
      case 'documentation':
        return `Hei! Jeg er AI-Revi, din dokumentanalyse-ekspert for ${clientName}.

📁 **DOKUMENTSTATUS:**
- ${docCount} dokumenter i systemet
- Kategorier: ${categories.length > 0 ? categories.join(', ') : 'Venter på kategorisering'}

Jeg kan hjelpe deg med å analysere, kategorisere og kvalitetssikre dokumenter. Spør meg om dokumenttyper, kategorisering eller kvalitetsvurderinger.

🏷️ **EMNER:** Dokumentanalyse, Kategorisering, Kvalitetssikring, Dokumenttyper`;
        
      case 'audit-actions':
        return `Hei! Jeg er AI-Revi, din revisjonshandlings-assistent for ${clientName}.

📋 **REVISJONSKONTEXT:**
- Klient: ${clientName}
- ${docCount} dokumenter tilgjengelig for analyse

Jeg kan hjelpe deg med planlegging og gjennomføring av revisjonshandlinger, ISA-standarder og kvalitetssikring.

🏷️ **EMNER:** Revisjonshandlinger, ISA-standarder, Planlegging, Kvalitetssikring`;
        
      default:
        return `Hei! Jeg er AI-Revi, din smarte revisjonsassistent. Jeg kan hjelpe deg med revisjon, regnskapsføring, dokumentanalyse og mye mer. Hvordan kan jeg hjelpe deg i dag?

🏷️ **EMNER:** Revisjon, Regnskapsføring, Dokumenter, Rådgivning`;
    }
  };

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
      console.log(`🤖 Generating AI response with context: ${currentContext} and variant:`, selectedVariant?.name || 'default');
      
      // Convert RevyMessage[] to RevyChatMessage[] format expected by the enhanced AI service
      const chatHistory: RevyChatMessage[] = updatedMessages.map(msg => ({
        id: msg.id,
        session_id: sessionId || '',
        sender: msg.sender,
        content: typeof msg.content === 'string' ? msg.content : String(msg.content),
        created_at: msg.timestamp,
        metadata: {}
      }));

      // Use enhanced AI service with dynamic context and variant
      const aiResponse = await generateEnhancedAIResponseWithVariant(
        userMessage,
        currentContext,
        chatHistory,
        clientData,
        userRole,
        sessionId,
        selectedVariant
      );

      console.log('🔍 AI response received with context-aware content:', {
        context: currentContext,
        variant: selectedVariant?.name,
        responseLength: aiResponse.length
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
        content: `Beklager, jeg kunne ikke behandle forespørselen din akkurat nå. Vennligst prøv igjen senere.\n\n🏷️ **EMNER:** Feilmeldinger, Support`,
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

  // Get context display name for user feedback
  const getContextDisplayName = (ctx: RevyContext) => {
    const contextMap = {
      'documentation': 'Dokumentanalyse',
      'audit-actions': 'Revisjonshandlinger', 
      'client-detail': 'Klientdetaljer',
      'planning': 'Planlegging',
      'execution': 'Gjennomføring',
      'completion': 'Avslutning',
      'general': 'Generell assistanse'
    };
    return contextMap[ctx] || 'Generell assistanse';
  };

  if (embedded) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header with context indicator */}
        <div className={`border-b border-border flex-shrink-0 ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center gap-3">
            <RevyAvatar />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>AI-Revi</h3>
                {selectedVariant && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {selectedVariant.display_name.replace('AI-Revi ', '')}
                  </span>
                )}
              </div>
              <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {getContextDisplayName(currentContext)} - {selectedVariant?.description || 'Din smarte revisjonsassistent'}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <KnowledgeStatusIndicator />
          </div>
        </div>
        
        {/* Messages - Fixed height with proper scroll */}
        <div className="flex-1 min-h-0 overflow-hidden">
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
              placeholder={`Spør ${selectedVariant?.display_name || 'AI-Revi'} om ${getContextDisplayName(currentContext).toLowerCase()}...`}
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
              {getContextDisplayName(currentContext)} - {selectedVariant?.description || 'Din smarte revisjonsassistent'}
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
              placeholder={`Spør ${selectedVariant?.display_name || 'AI-Revi'} om ${getContextDisplayName(currentContext).toLowerCase()}...`}
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
