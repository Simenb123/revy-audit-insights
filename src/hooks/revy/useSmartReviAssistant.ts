import { logger } from '@/utils/logger';

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { generateAIResponse } from '@/services/revy/aiInteractionService';
import { generateEnhancedAIResponseWithVariant } from '@/services/revy/enhancedAiInteractionService';
import { getEnhancedContextualTips } from '@/services/enhancedRevyService';
import { useRevyChatSessions } from './useRevyChatSessions';
import { useRevyChatMessages } from './useRevyChatMessages';
import { RevyMessage, RevyChatMessage } from '@/types/revio';

interface UseSmartReviAssistantProps {
  clientData?: any;
  userRole?: string;
  embedded?: boolean;
}

// Map DB message to UI message
const mapMessageToUIMessage = (msg: RevyChatMessage): RevyMessage => ({
    id: msg.id,
    content: msg.content,
    timestamp: new Date(msg.created_at),
    sender: msg.sender === 'revy' ? 'assistant' : msg.sender as 'user' | 'assistant',
    metadata: msg.metadata
});

export const useSmartReviAssistant = ({ clientData, userRole, embedded = false }: UseSmartReviAssistantProps) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const { sessions, isLoading: sessionsLoading, createSession } = useRevyChatSessions();
  const { messages: dbMessages, isLoading: messagesLoading, sendMessage } = useRevyChatMessages(activeSessionId);
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const { toast } = useToast();
  const { state } = useRevyContext();

  const enhancedContext = state.currentContext;

  const handleCreateSession = useCallback(async (title?: string) => {
    logger.log('🔥 Creating new session with title:', title);
    try {
      const newSession = await createSession({
        title: title || `Ny samtale ${new Date().toLocaleDateString()}`,
        context: enhancedContext,
        clientId: clientData?.id,
      });
      logger.log('✅ Session created successfully:', newSession);
      setActiveSessionId(newSession.id);
      
      // Add welcome message to new session
      const welcomeContent = `Hei! Jeg er AI-Revi, din AI-drevne revisjonsassistent. Hvordan kan jeg hjelpe deg i dag?`;
      await sendMessage({
        content: welcomeContent,
        sender: 'revy',
      });
      logger.log('✅ Welcome message sent to new session');
      
      return newSession;
    } catch (error) {
      logger.error('❌ Failed to create session:', error);
      toast({ title: "Feil", description: "Kunne ikke opprette en ny samtale.", variant: "destructive" });
      throw error;
    }
  }, [createSession, enhancedContext, clientData?.id, sendMessage, toast]);
  
  // Enhanced effect to manage sessions with variant context
  useEffect(() => {
    logger.log('🔍 Managing sessions - sessionsLoading:', sessionsLoading, 'sessions.length:', sessions.length, 'activeSessionId:', activeSessionId);
    
    if (sessionsLoading) {
      logger.log('⏳ Sessions still loading...');
      return;
    }

    if (embedded) {
      // For embedded, we want one session per context
      const contextTitle = `Embedded: ${enhancedContext} ${clientData?.id || ''} ${selectedVariant?.name || ''}`;
      const existingSession = sessions.find(s => s.title === contextTitle);
      logger.log('🔍 Looking for embedded session with title:', contextTitle, 'found:', !!existingSession);
      
      if (existingSession) {
        if (activeSessionId !== existingSession.id) {
          logger.log('✅ Setting active session to existing embedded session:', existingSession.id);
          setActiveSessionId(existingSession.id);
        }
      } else {
        logger.log('📝 Creating new embedded session');
        handleCreateSession(contextTitle).catch(logger.error);
      }
    } else {
      // For floating, pick the most recent one or create a new one
      if (sessions.length > 0 && !activeSessionId) {
        logger.log('✅ Setting active session to most recent:', sessions[0].id);
        setActiveSessionId(sessions[0].id);
      } else if (sessions.length === 0 && !activeSessionId) {
        logger.log('📝 No sessions exist, creating first session');
        handleCreateSession().catch(logger.error);
      }
    }
  }, [sessions, sessionsLoading, embedded, enhancedContext, clientData?.id, activeSessionId, selectedVariant?.name, handleCreateSession]);

  useEffect(() => {
    const fetchTip = async () => {
      try {
        // Assuming getEnhancedContextualTips might be async and needs to be awaited.
        const tip = await getEnhancedContextualTips(enhancedContext, clientData, userRole);
        setCurrentTip(tip || '');
      } catch (e) {
        logger.error("Failed to get contextual tip", e);
        setCurrentTip('');
      }
    };
    fetchTip();
  }, [enhancedContext, clientData, userRole]);

  const handleSendMessage = async () => {
    logger.log('🚀 handleSendMessage called with:', { 
      message: message.substring(0, 50) + '...', 
      isTyping, 
      activeSessionId,
      hasMessage: !!message.trim()
    });
    
    if (!message.trim()) {
      logger.log('❌ No message to send');
      return;
    }

    if (isTyping) {
      logger.log('❌ Already processing a message');
      return;
    }
    
    if (!activeSessionId) {
      logger.log('❌ No active session - attempting to create one');
      try {
        const newSession = await handleCreateSession();
        if (!newSession?.id) {
          logger.error('❌ Failed to create session for message');
          toast({ title: "Feil", description: "Kunne ikke opprette samtale for å sende melding.", variant: "destructive" });
          return;
        }
        // Wait a moment for the session to be set
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error('❌ Could not create session for message:', error);
        return;
      }
    }
    
    const userMessageContent = message;
    setMessage('');
    
    const historyBeforeSend = dbMessages;
    logger.log('📝 Sending user message:', userMessageContent.substring(0, 100) + '...');

    try {
      await sendMessage({
        content: userMessageContent,
        sender: 'user'
      });
      logger.log('✅ User message saved to database');
    } catch (error) {
      logger.error('❌ Failed to save user message:', error);
      toast({ title: "Feil", description: "Kunne ikke lagre melding.", variant: "destructive" });
      return;
    }

    setIsTyping(true);
    logger.log('⏳ Set isTyping to true, calling AI service...');
    
    try {
      logger.log('🤖 Calling generateEnhancedAIResponseWithVariant with params:', {
        message: userMessageContent.substring(0, 50) + '...',
        context: enhancedContext,
        historyLength: historyBeforeSend.length,
        hasClientData: !!clientData,
        userRole,
        sessionId: activeSessionId,
        variantName: selectedVariant?.name || 'default'
      });

      // Use enhanced AI response with variant support
      const responseText = await generateEnhancedAIResponseWithVariant(
        userMessageContent, 
        enhancedContext,
        historyBeforeSend,
        clientData,
        userRole,
        activeSessionId,
        selectedVariant
      );
      
      logger.log('✅ AI response received:', {
        responseLength: responseText?.length || 0,
        responsePreview: responseText?.substring(0, 100) + '...',
        responseType: typeof responseText,
        isString: typeof responseText === 'string',
        isEmpty: !responseText || responseText.trim() === ''
      });

      if (!responseText || typeof responseText !== 'string' || responseText.trim() === '') {
        logger.error('❌ Invalid AI response received:', responseText);
        throw new Error('AI returnerte en tom eller ugyldig respons');
      }
      
      logger.log('💾 Saving AI response to database...');
      await sendMessage({
        content: responseText,
        sender: 'revy'
      });
      logger.log('✅ AI response saved successfully');

    } catch (error) {
      logger.error('💥 Error in handleSendMessage:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'En ukjent feil oppstod.';
      logger.log('🆘 Sending fallback error message:', errorMessage);
      
      const fallbackContent = `Beklager, jeg opplever tekniske problemer akkurat nå. Prøv igjen om litt. 

**Feil:** ${errorMessage}

**Feilsøking:**
• Sjekk internett-tilkoblingen din
• Prøv å laste siden på nytt
• Kontakt support hvis problemet vedvarer

🏷️ **EMNER:** Teknisk support, Feilsøking, AI-assistanse`;

      try {
        await sendMessage({ content: fallbackContent, sender: 'revy' });
        logger.log('✅ Fallback message sent successfully');
      } catch (fallbackError) {
        logger.error('💥 Failed to send fallback message:', fallbackError);
        toast({
          title: "Kritisk feil",
          description: "Kunne ikke sende feilmelding. Prøv å laste siden på nytt.",
          variant: "destructive"
        });
      }

      toast({
        title: "AI-feil",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      logger.log('🔄 Setting isTyping to false');
      setIsTyping(false);
    }
  };

  const handleVariantChange = (variant: any) => {
    setSelectedVariant(variant);
    // Optionally create a new session when variant changes for better context separation
    if (!embedded) {
      const variantTitle = `${variant.display_name} - ${new Date().toLocaleDateString()}`;
      handleCreateSession(variantTitle);
    }
  };

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    handleCreateSession,
    messages: dbMessages.map(mapMessageToUIMessage),
    message,
    setMessage,
    isTyping: isTyping || messagesLoading || sessionsLoading,
    currentTip,
    handleSendMessage,
    selectedVariant,
    handleVariantChange,
  };
};
