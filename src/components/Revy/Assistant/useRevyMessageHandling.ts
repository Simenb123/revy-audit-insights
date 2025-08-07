
import { logger } from '@/utils/logger';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { RevyContext, RevyChatMessage, RevyMessage } from '@/types/revio';
import { enhanceAIResponse } from '@/services/revyEnhancementService';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { toast } from 'sonner';

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
  const [isAnalyzingDocuments, setIsAnalyzingDocuments] = useState(false);
  const { session } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Get client documents for AI context
  const { documents: clientDocuments } = useClientDocuments(clientData?.id);

  // Create or load session
  useEffect(() => {
    const initializeSession = async () => {
      if (!session?.user?.id) {
        logger.warn('No authenticated user - cannot initialize Revy session');
        return;
      }

      try {
        // First, try to find existing session for this context
        let query = supabase
          .from('revy_chat_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('context', context)
          .order('updated_at', { ascending: false })
          .limit(1);

        // Handle client_id properly - only add filter if we have a valid client ID
        if (clientData?.id && typeof clientData.id === 'string' && clientData.id.trim() !== '') {
          query = query.eq('client_id', clientData.id);
        } else {
          query = query.is('client_id', null);
        }

        const { data: existingSessions, error: fetchError } = await query;

        if (fetchError) {
          logger.error('Error fetching existing sessions:', fetchError);
          throw fetchError;
        }

        let currentSessionId: string;

        if (existingSessions && existingSessions.length > 0) {
          // Use existing session
          currentSessionId = existingSessions[0].id;
          logger.log('💬 Using existing session:', currentSessionId);
        } else {
          // Create new session
          const sessionData: any = {
            user_id: session.user.id,
            context: context,
            title: `${context} - ${clientData?.company_name || 'General'}`
          };

          // Only add client_id if we have a valid client ID
          if (clientData?.id && typeof clientData.id === 'string' && clientData.id.trim() !== '') {
            sessionData.client_id = clientData.id;
          }

          const { data: newSession, error: createError } = await supabase
            .from('revy_chat_sessions')
            .insert(sessionData)
            .select()
            .single();

          if (createError) {
            logger.error('Error creating new session:', createError);
            throw createError;
          }

          currentSessionId = newSession.id;
          logger.log('💬 Created new session:', currentSessionId);
        }

        setSessionId(currentSessionId);
      } catch (error) {
        logger.error('Failed to initialize session:', error);
        toast.error('Kunne ikke starte chat-sesjon', {
          description: 'Prøv å laste siden på nytt eller logg inn igjen.'
        });
      }
    };

    initializeSession();
  }, [session?.user?.id, context, clientData?.id, clientData?.company_name]);

  // Function to detect if message is asking about documents
  const isDocumentQuery = (message: string): boolean => {
    const documentKeywords = [
      'dokument', 'faktura', 'rapport', 'fil', 'innhold', 'står på', 'viser',
      'hva inneholder', 'kan du lese', 'se på', 'analyser', 'gjennomgå',
      'nummer', 'kvitering', 'bilag', 'regning'
    ];
    
    const messageLower = message.toLowerCase();
    return documentKeywords.some(keyword => messageLower.includes(keyword));
  };

  // Function to get contextual welcome message with enhanced client data
  const getContextualWelcomeMessage = (ctx: RevyContext, client?: any) => {
    const clientName = client?.company_name || client?.name || 'klienten';
    const docCount = client?.documentSummary?.totalDocuments || 0;
    const categories = client?.documentSummary?.categories || [];
    const recentDocs = client?.documentSummary?.recentDocuments || [];
    
    switch (ctx) {
      case 'client-detail':
        return `Hei! Jeg er **AI-Revy**, din smarte revisjonsassistent. Jeg kan hjelpe deg med analyse av ${clientName}.

## 📊 KLIENTOVERSIKT
- **${docCount} dokumenter** tilgjengelig
- **Kategorier:** ${categories.length > 0 ? categories.join(', ') : 'Ingen kategorier ennå'}
- **Siste dokumenter:** ${recentDocs.length > 0 ? recentDocs.map((d: any) => d.name).join(', ') : 'Ingen dokumenter ennå'}

Jeg kan hjelpe deg med **klientanalyse**, **dokumentgjennomgang**, **risikovurdering** og **revisjonsplanlegging**. Hva vil du vite om denne klienten?

**🏷️ EMNER:** Klientanalyse • Dokumenter • Risikovurdering • Revisjonsplanlegging`;
        
      case 'documentation':
        return `Hei! Jeg er **AI-Revy**, din dokumentanalyse-ekspert for ${clientName}.

## 📁 DOKUMENTSTATUS
- **${docCount} dokumenter** i systemet
- **Kategorier:** ${categories.length > 0 ? categories.join(', ') : 'Venter på kategorisering'}

Jeg kan hjelpe deg med å **analysere**, **kategorisere** og **kvalitetssikre** dokumenter. Spør meg om dokumenttyper, kategorisering eller kvalitetsvurderinger.

**🏷️ EMNER:** Dokumentanalyse • Kategorisering • Kvalitetssikring • Dokumenttyper`;
        
      case 'audit-actions':
        return `Hei! Jeg er **AI-Revy**, din revisjonshandlings-assistent for ${clientName}.

## 📋 REVISJONSKONTEXT
- **Klient:** ${clientName}
- **${docCount} dokumenter** tilgjengelig for analyse

Jeg kan hjelpe deg med **planlegging** og **gjennomføring** av revisjonshandlinger, **ISA-standarder** og **kvalitetssikring**.

**🏷️ EMNER:** Revisjonshandlinger • ISA-standarder • Planlegging • Kvalitetssikring`;
        
      default:
        return `Hei! Jeg er **AI-Revy**, din smarte revisjonsassistent. 

Jeg kan hjelpe deg med **revisjon**, **regnskapsføring**, **dokumentanalyse** og mye mer. Hvordan kan jeg hjelpe deg i dag?

**🏷️ EMNER:** Revisjon • Regnskapsføring • Dokumenter • Rådgivning`;
    }
  };

  // Load previous messages from session or add welcome message
  useEffect(() => {
    const loadPreviousMessages = async () => {
      if (!sessionId || !session?.user?.id) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('revy_chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) {
          logger.error('Error loading messages:', error);
          throw error;
        }

        if (data && data.length > 0) {
          const loadedMessages: RevyMessage[] = data.map(msg => ({
            id: msg.id,
            sender: msg.sender === 'revy' ? 'assistant' : msg.sender as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(loadedMessages);
          logger.log(`💬 Loaded ${loadedMessages.length} previous messages from session ${sessionId}`);
        } else {
          // Add welcome message for new sessions
          const welcomeContent = getContextualWelcomeMessage(context, clientData);
          const enhancedWelcome = enhanceAIResponse(welcomeContent, context, clientData);
          
          const welcomeMsg: RevyMessage = {
            id: crypto.randomUUID(),
            sender: 'assistant',
            content: enhancedWelcome.content,
            timestamp: new Date(),
            links: enhancedWelcome.links,
            sources: enhancedWelcome.sources
          };
          setMessages([welcomeMsg]);
          
          // Save welcome message to database
          try {
            const { error: saveError } = await supabase
              .from('revy_chat_messages')
              .insert({
                session_id: sessionId,
                sender: 'revy',
                content: welcomeContent
              });

            if (saveError) {
              logger.error('Error saving welcome message:', saveError);
            }
          } catch (saveError) {
            logger.error('Error saving welcome message:', saveError);
          }
        }
      } catch (error) {
        logger.error('Error loading messages:', error);
        toast.error('Kunne ikke laste chat-historie', {
          description: 'Prøv å laste siden på nytt.'
        });
      }
    };

    loadPreviousMessages();
  }, [sessionId, session?.user?.id, context, clientData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!session?.user?.id) {
      toast.error('Du må være innlogget for å chatte', {
        description: 'Logg inn for å fortsette samtalen.'
      });
      return;
    }

    if (!sessionId) {
      toast.error('Ingen aktiv chat-sesjon', {
        description: 'Prøv å laste siden på nytt.'
      });
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Check if this is a document query to show analysis indicator
    const isDocQuery = isDocumentQuery(userMessage);
    if (isDocQuery && clientData?.id) {
      setIsAnalyzingDocuments(true);
    }

    // Add user message to chat
    const newUserMessage: RevyMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    try {
      logger.log(`🤖 Sending message to AI-Revy with context: ${context}`);
      
      // Call the improved revy-ai-chat function directly
      const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
        body: {
          message: userMessage,
          context: context,
          variantName: selectedVariant?.name || 'support',
          clientData: clientData,
          clientDocuments: clientDocuments || []
        }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (!data || !data.response) {
        throw new Error('No response received from AI');
      }

      logger.log('🔍 AI response received:', data.response.substring(0, 100) + '...');

      // Enhance the AI response with links and sources
      const enhancedResponse = enhanceAIResponse(
        data.response, 
        context, 
        clientData, 
        data.knowledgeArticles
      );

      const aiMessage: RevyMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: enhancedResponse.content,
        timestamp: new Date(),
        links: enhancedResponse.links,
        sources: enhancedResponse.sources
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save messages to session
      try {
        const { error: saveError } = await supabase
          .from('revy_chat_messages')
          .insert([
            { session_id: sessionId, sender: 'user', content: userMessage },
            { session_id: sessionId, sender: 'revy', content: data.response }
          ]);

        if (saveError) {
          logger.error('Error saving messages:', saveError);
          toast.error('Kunne ikke lagre meldinger', {
            description: 'Meldingene vises i chatten, men lagres ikke permanent.'
          });
        }
      } catch (saveError) {
        logger.error('Error saving messages:', saveError);
      }

      // Show success toast if knowledge was used
      if (data.hasKnowledgeReferences) {
        toast.success('AI-Revy brukte fagartikler', {
          description: 'Svaret er basert på relevant faginnhold'
        });
      }

    } catch (error) {
      logger.error('Error getting AI response:', error);
      
      let errorMessage = `Beklager, jeg opplever tekniske problemer akkurat nå. 

**Feilmelding:** ${error.message}

**Forslag:**
• Prøv igjen om litt
• Sjekk internett-tilkoblingen din
• Kontakt support hvis problemet vedvarer`;

      // Show user-friendly toast
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        toast.error('Forespørselen tok for lang tid', {
          description: 'Prøv å gjenta spørsmålet ditt'
        });
      } else if (error.message.includes('503') || error.message.includes('temporarily unavailable')) {
        toast.error('AI-tjenesten er midlertidig utilgjengelig', {
          description: 'Prøv igjen om noen minutter'
        });
      } else {
        toast.error('Teknisk feil', {
          description: 'AI-Revy kunne ikke svare på spørsmålet ditt'
        });
      }

      const errorAiMessage: RevyMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
      setIsAnalyzingDocuments(false);
    }
  };

  // Return authentication state along with other values
  return {
    messages,
    input,
    isLoading,
    isAnalyzingDocuments,
    handleInputChange,
    handleKeyDown,
    handleSendMessage,
    isAuthenticated: !!session?.user?.id,
    sessionId
  };
};
