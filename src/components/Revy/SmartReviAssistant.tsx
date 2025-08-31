import { logger } from '@/utils/logger';

import React, { useEffect } from 'react';
import { RevyContext } from '@/types/revio';
import EmbeddedRevyAssistant from './Assistant/EmbeddedRevyAssistant';
import StandaloneRevyAssistant from './Assistant/StandaloneRevyAssistant';
import { useRevyMessageHandling } from './Assistant/useRevyMessageHandling';
import { useAIRevyVariants } from '@/hooks/useAIRevyVariants';
import MultiAgentIntegration from '@/components/AI/MultiAgentIntegration';
import { useSmartRevyEnhancements } from '@/hooks/useSmartRevyEnhancements';
import { advancedCacheManager } from '@/services/advancedCacheManager'; 
import { BatchProcessingManager } from '@/services/batchProcessingManager';
import SmartContextSwitcher from './Assistant/SmartContextSwitcher';
import IntelligentLoadingFeedback from './Assistant/IntelligentLoadingFeedback';

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

  // Use AI-Revy variants hook to get available variants and selection
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
  
  // Use smart enhancements hook for advanced processing
  const {
    isAnalyzing,
    contextAnalysis,
    enhancedPromptData,
    performAnalysis,
    isEnhancementReady
  } = useSmartRevyEnhancements();

  // Initialize smart enhancements when context changes
  useEffect(() => {
    if (currentContext && clientData && messages) {
      performAnalysis({
        context: currentContext,
        clientData,
        documentContext: undefined,
        userRole: userRole || 'employee',
        sessionHistory: messages
      });
    }
  }, [currentContext, clientData, userRole, performAnalysis, messages]);

  // Add context change effect to show visual feedback
  useEffect(() => {
    if (embedded && onContextChange) {
      logger.log(`🔄 AI-Revy context changed to: ${currentContext}${activeVariant ? ` with variant: ${activeVariant.name}` : ''}`);
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
        'knowledge-base': 'Kunnskapsbase',
        'knowledge': 'Kunnskap',
        'fag': 'Fagområde'
      };
      return contextMap[ctx] || 'Generell assistanse';
    };

  const contextDisplayName = getContextDisplayName(currentContext);

  if (embedded) {
    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Compact status bar for embedded mode */}
        <div className="flex-shrink-0 px-2 py-1 border-b bg-muted/20 space-y-1">
          {/* Intelligent Loading Feedback - compact version */}
          {(isLoading || isAnalyzing) && (
            <IntelligentLoadingFeedback
              isLoading={isLoading || isAnalyzing}
              context={currentContext}
              enhancementApplied={isEnhancementReady}
              estimatedTime={15000}
            />
          )}
          
          {/* Smart Context Switcher - compact badge only when recommendations exist */}
          <SmartContextSwitcher
            currentContext={currentContext}
            clientData={clientData}
            documentContext={undefined}
            userRole={userRole}
            sessionHistory={messages}
            onContextChange={onContextChange}
            compact={true}
          />
        </div>

        {/* Main chat interface - takes remaining space */}
        <div className="flex-1 min-h-0">
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
        </div>

        {/* Multi-agent integration - show as floating button when relevant */}
        {messages.length > 2 && (
          <div className="flex-shrink-0 p-2 border-t">
            <MultiAgentIntegration 
              context={currentContext} 
              clientId={clientData?.id}
              documentContext={undefined}
              compact={true}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Smart Context Switcher for standalone mode */}
      <SmartContextSwitcher
        currentContext={currentContext}
        clientData={clientData}
        documentContext={undefined}
        userRole={userRole}
        sessionHistory={messages}
        onContextChange={onContextChange}
      />
      
      {/* Intelligent Loading Feedback - show analysis and processing state */}
      <IntelligentLoadingFeedback
        isLoading={isLoading || isAnalyzing}
        context={currentContext}
        enhancementApplied={isEnhancementReady}
        estimatedTime={20000}
      />
      
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
    </div>
  );
};

export default SmartReviAssistant;
