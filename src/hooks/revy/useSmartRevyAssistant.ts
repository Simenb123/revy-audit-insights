import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { generateAIResponse } from '@/services/revyService';
import { detectEnhancedContext, getEnhancedContextualTips, buildEnhancedMessage } from '@/services/enhancedRevyService';
import { seedKnowledgeBase } from '@/services/knowledgeSeederService';
import { RevyMessage, RevyContext } from '@/types/revio';

interface UseSmartRevyAssistantProps {
  clientData?: any;
  userRole?: string;
}

const getContextDisplayName = (context: RevyContext): string => {
  const names: Record<RevyContext, string> = {
    'dashboard': 'dashboard',
    'client-overview': 'klientoversikt',
    'client-detail': 'klientdetaljer',
    'audit-actions': 'revisjonshandlinger',
    'risk-assessment': 'risikovurdering',
    'documentation': 'dokumentasjon',
    'collaboration': 'samarbeid',
    'communication': 'kommunikasjon',
    'team-management': 'teamledelse',
    'drill-down': 'dataanalyse',
    'mapping': 'kontomapping',
    'general': 'hovedområdet'
  };
  return names[context] || context;
};

export const useSmartRevyAssistant = ({ clientData, userRole }: UseSmartRevyAssistantProps) => {
  const [messages, setMessages] = useState<RevyMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentTip, setCurrentTip] = useState('');
  const [knowledgeSeeded, setKnowledgeSeeded] = useState(false);
  const { toast } = useToast();
  const { currentContext } = useRevyContext();
  const location = useLocation();

  const enhancedContext = detectEnhancedContext(location.pathname, clientData);

  useEffect(() => {
    const initializeAssistant = async () => {
      if (messages.length === 0) {
        if (!knowledgeSeeded) {
          await seedKnowledgeBase();
          setKnowledgeSeeded(true);
        }

        const tip = await getEnhancedContextualTips(enhancedContext, clientData, userRole);
        setCurrentTip(tip);

        const welcomeMessage: RevyMessage = {
          id: '1',
          content: `Hei! Jeg er Revy, din AI-drevne revisjonsassistent. Jeg er nå oppgradert med tilgang til appens kunnskapsbase og kan gi deg mye bedre veiledning!\n\n${tip}\n\nNoen eksempler på hva du kan spørre meg om:\n• "Hvordan kommer jeg i gang med Revio?"\n• "Hvordan legger jeg til en ny klient?"\n• "Hva er ISA 315 og hvordan bruker jeg den?"\n• "Hvilke revisjonshandlinger bør jeg utføre for denne klienten?"`,
          timestamp: new Date().toISOString(),
          sender: 'revy'
        };
        
        setMessages([welcomeMessage]);
      }
    };

    initializeAssistant();
  }, [enhancedContext, clientData, userRole, messages.length, knowledgeSeeded]);

  useEffect(() => {
    const updateTip = async () => {
      if (messages.length > 0) {
        const tip = await getEnhancedContextualTips(enhancedContext, clientData, userRole);
        setCurrentTip(tip);
        
        const contextMessage: RevyMessage = {
          id: Date.now().toString(),
          content: `💡 Jeg ser at du har byttet til ${getContextDisplayName(enhancedContext)}. ${tip}`,
          timestamp: new Date().toISOString(),
          sender: 'revy'
        };
        
        setMessages(prev => [...prev, contextMessage]);
      }
    };

    if(clientData?.id) updateTip();
  }, [enhancedContext, clientData?.id]);

  const handleSendMessage = async () => {
    if (!message.trim() || isTyping) return;
    
    const userMessage: RevyMessage = { 
      id: Date.now().toString(), 
      content: message,
      timestamp: new Date().toISOString(),
      sender: 'user'
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setMessage('');
    setIsTyping(true);
    
    try {
      const { message: enhancedMessage, enhancedContext: fullContext } = await buildEnhancedMessage(
        userMessage.content as string,
        enhancedContext,
        clientData,
        userRole
      );

      console.log('🧠 Sending enhanced message with context:', fullContext);
      
      const responseText = await generateAIResponse(
        enhancedMessage, 
        enhancedContext,
        fullContext,
        userRole,
        sessionId
      );
      
      const revyMessageId = (Date.now() + 1).toString();
      const initialRevyResponse: RevyMessage = {
        id: revyMessageId,
        content: '',
        timestamp: new Date().toISOString(),
        sender: 'revy'
      };
      
      setMessages(prev => [...prev, initialRevyResponse]);

      const words = responseText.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(r => setTimeout(r, 50));
        setMessages(prev => prev.map(msg => 
          msg.id === revyMessageId 
            ? { ...msg, content: words.slice(0, i + 1).join(' ') }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const fallbackResponse: RevyMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Beklager, jeg opplever tekniske problemer akkurat nå. Men jeg kan fortsatt hjelpe deg med grunnleggende spørsmål om Revio og revisjonsmetodikk. Prøv å spørre meg om ISA-standarder, klientadministrasjon eller appfunksjonalitet.',
        timestamp: new Date().toISOString(),
        sender: 'revy'
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
      
      toast({
        title: "AI-feil",
        description: "Kunne ikke få svar fra AI-assistenten",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  return {
    messages,
    message,
    setMessage,
    isTyping,
    currentTip,
    handleSendMessage,
  };
};
