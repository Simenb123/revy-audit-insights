
import React, { useEffect } from 'react';
import { RevyContext } from '@/types/revio';
import EmbeddedRevyAssistant from './Assistant/EmbeddedRevyAssistant';
import StandaloneRevyAssistant from './Assistant/StandaloneRevyAssistant';
import { useRevyMessageHandling } from './Assistant/useRevyMessageHandling';

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
  const currentContext = context;

  const {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleKeyDown,
    handleSendMessage
  } = useRevyMessageHandling({
    context: currentContext,
    clientData,
    userRole,
    selectedVariant
  });

  // Add context change effect to show visual feedback
  useEffect(() => {
    if (embedded && onContextChange) {
      console.log(`🔄 AI-Revi context changed to: ${currentContext}${selectedVariant ? ` with variant: ${selectedVariant.name}` : ''}`);
    }
  }, [currentContext, selectedVariant, embedded, onContextChange]);

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

  const contextDisplayName = getContextDisplayName(currentContext);

  if (embedded) {
    return (
      <EmbeddedRevyAssistant
        messages={messages}
        input={input}
        isLoading={isLoading}
        selectedVariant={selectedVariant}
        contextDisplayName={contextDisplayName}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onSendMessage={handleSendMessage}
      />
    );
  }

  return (
    <StandaloneRevyAssistant
      messages={messages}
      input={input}
      isLoading={isLoading}
      selectedVariant={selectedVariant}
      contextDisplayName={contextDisplayName}
      onInputChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onSendMessage={handleSendMessage}
    />
  );
};

export default SmartReviAssistant;
