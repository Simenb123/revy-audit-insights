import { logger } from '@/utils/logger';

import React, { useEffect } from 'react';
import { RevyContext } from '@/types/revio';
import EmbeddedRevyAssistant from './Assistant/EmbeddedRevyAssistant';
import StandaloneRevyAssistant from './Assistant/StandaloneRevyAssistant';
import { useRevyMessageHandling } from './Assistant/useRevyMessageHandling';
import { useAIRevyVariants } from '@/hooks/useAIRevyVariants';

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

  // Use AI-Revi variants hook to get available variants and selection
  const { variants, selectedVariant: autoSelectedVariant, switchVariant } = useAIRevyVariants(currentContext);
  
  // Use provided selectedVariant or fallback to auto-selected
  const activeVariant = selectedVariant || autoSelectedVariant;

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
    selectedVariant: activeVariant
  });

  // Add context change effect to show visual feedback
  useEffect(() => {
    if (embedded && onContextChange) {
      logger.log(`🔄 AI-Revi context changed to: ${currentContext}${activeVariant ? ` with variant: ${activeVariant.name}` : ''}`);
    }
  }, [currentContext, activeVariant, embedded, onContextChange]);

  // Get context display name for user feedback
    const getContextDisplayName = (ctx: RevyContext) => {
      const contextMap: Record<RevyContext, string> = {
        'dashboard': 'Dashboard',
        'client-overview': 'Klientoversikt',
        'client-detail': 'Klientdetaljer',
        'audit-actions': 'Revisjonshandlinger',
        'risk-assessment': 'Risikovurdering',
        'documentation': 'Dokumentanalyse',
        'collaboration': 'Samarbeid',
        'communication': 'Kommunikasjon',
        'team-management': 'Team',
        'drill-down': 'Detaljer',
        'mapping': 'Kartlegging',
        'general': 'Generell assistanse',
        'accounting-data': 'Regnskapsdata',
        'analysis': 'Analyse',
        'data-upload': 'Opplasting',
        'knowledge-base': 'Kunnskapsbase'
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
        selectedVariant={activeVariant}
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
      selectedVariant={activeVariant}
      contextDisplayName={contextDisplayName}
      onInputChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onSendMessage={handleSendMessage}
    />
  );
};

export default SmartReviAssistant;
