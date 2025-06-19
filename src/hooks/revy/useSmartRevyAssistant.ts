import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { generateAIResponse } from '@/services/revy/aiInteractionService';
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
    timestamp: msg.created_at,
    sender: msg.sender,
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
  const { currentContext } = useRevyContext();

  const enhancedContext = currentContext;

  const handleCreateSession = useCallback(async (title?: string) => {
    try {
      const newSession = await createSession({
        title: title || `Ny samtale ${new Date().toLocaleDateString()}`,
        context: enhancedContext,
        clientId: clientData?.id,
      });
      setActiveSessionId(newSession.id);
      
      // Add welcome message to new session
      await sendMessage({
        content: `Hei! Jeg er AI-Revi, din AI-drevne revisjonsassistent. Hvordan kan jeg hjelpe deg i dag?`,
        sender: 'revy',
      });
    } catch (error) {
      toast({ title: "Feil", description: "Kunne ikke opprette en ny samtale.", variant: "destructive" });
    }
  }, [createSession, enhancedContext, clientData?.id, sendMessage, toast]);
  
  // Enhanced effect to manage sessions with variant context
  useEffect(() => {
    if (sessionsLoading) return;

    if (embedded) {
      // For embedded, we want one session per context
      const contextTitle = `Embedded: ${enhancedContext} ${clientData?.id || ''} ${selectedVariant?.name || ''}`;
      const existingSession = sessions.find(s => s.title === contextTitle);
      if (existingSession) {
        if (activeSessionId !== existingSession.id) {
          setActiveSessionId(existingSession.id);
        }
      } else {
        handleCreateSession(contextTitle);
      }
    } else {
      // For floating, pick the most recent one or create a new one
      if (sessions.length > 0 && !activeSessionId) {
        setActiveSessionId(sessions[0].id);
      } else if (sessions.length === 0) {
        handleCreateSession();
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
        console.error("Failed to get contextual tip", e);
        setCurrentTip('');
      }
    };
    fetchTip();
  }, [enhancedContext, clientData, userRole]);

  const handleSendMessage = async () => {
    if (!message.trim() || isTyping || !activeSessionId) return;
    
    const userMessageContent = message;
    setMessage('');
    
    const historyBeforeSend = dbMessages;

    await sendMessage({
      content: userMessageContent,
      sender: 'user'
    });

    setIsTyping(true);
    
    try {
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
      
      await sendMessage({
        content: responseText,
        sender: 'revy'
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'En ukjent feil oppstod.';
      const fallbackContent = `Beklager, jeg opplever tekniske problemer akkurat nå. Prøv igjen om litt. (Feil: ${errorMessage})`;
      await sendMessage({ content: fallbackContent, sender: 'revy' });
      toast({
        title: "AI-feil",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
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
