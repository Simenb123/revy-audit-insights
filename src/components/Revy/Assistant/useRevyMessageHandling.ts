
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { RevyContext, RevyChatMessage, RevyMessage } from '@/types/revio';
import { generateEnhancedAIResponseWithVariant } from '@/services/revy/enhancedAiInteractionService';

interface UseRevyMessageHandlingProps {
  context: RevyContext;
  clientData?: any;
  userRole?: string;
  selectedVariant?: any;
}

export const useRevyMessageHandling = ({
  context,
  clientData,
  userRole,
  selectedVariant
}: UseRevyMessageHandlingProps) => {
  const [messages, setMessages] = useState<RevyMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Generate session ID
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

  // Load previous messages from session or add welcome message
  useEffect(() => {
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
            const welcomeMessage = getContextualWelcomeMessage(context, clientData);
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
  }, [sessionId, session?.user?.id, context, clientData]);

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
      console.log(`🤖 Generating AI response with context: ${context} and variant:`, selectedVariant?.name || 'default');
      
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
        context,
        chatHistory,
        clientData,
        userRole,
        sessionId,
        selectedVariant
      );

      console.log('🔍 AI response received with context-aware content:', {
        context: context,
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

  return {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleKeyDown,
    handleSendMessage
  };
};
