
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, MessageSquare, Lightbulb, FileText, Settings } from 'lucide-react';
import { useSmartReviAssistant } from '@/hooks/revy/useSmartRevyAssistant';
import { useAIRevyVariants } from '@/hooks/useAIRevyVariants';
import { useEnhancedClientDocuments } from '@/hooks/useEnhancedClientDocuments';
import { getContextualRecommendations } from '@/services/revy/enhancedAiInteractionService';
import AIRevyVariantSelector from '@/components/AI/AIRevyVariantSelector';
import { RevyMessageList } from '@/components/Revy/Assistant/RevyMessageList';
import { RevyInput } from '@/components/Revy/Assistant/RevyInput';

interface ContextAwareRevyChatProps {
  clientId?: string;
  clientData?: any;
  context: string;
  embedded?: boolean;
  showVariantSelector?: boolean;
}

const ContextAwareRevyChat: React.FC<ContextAwareRevyChatProps> = ({
  clientId,
  clientData,
  context,
  embedded = false,
  showVariantSelector = true
}) => {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
  const { selectedVariant, handleVariantChange } = useAIRevyVariants(context);
  const { getDocumentContext } = useEnhancedClientDocuments(clientId || '');
  
  // Enhanced client data with document context
  const enhancedClientData = React.useMemo(() => {
    if (!clientId) return clientData;
    
    const documentContext = getDocumentContext();
    return {
      ...clientData,
      documentContext
    };
  }, [clientData, clientId, getDocumentContext]);

  const {
    messages,
    message,
    setMessage,
    isTyping,
    currentTip,
    handleSendMessage,
    selectedVariant: assistantVariant,
    handleVariantChange: assistantVariantChange
  } = useSmartReviAssistant({
    clientData: enhancedClientData,
    userRole: 'employee',
    embedded
  });

  // Sync variant between components
  useEffect(() => {
    if (selectedVariant && assistantVariant?.id !== selectedVariant.id) {
      assistantVariantChange(selectedVariant);
    }
  }, [selectedVariant, assistantVariant, assistantVariantChange]);

  // Load contextual recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!selectedVariant) return;
      
      setIsLoadingRecommendations(true);
      try {
        const recs = await getContextualRecommendations(
          context,
          enhancedClientData,
          'employee',
          selectedVariant
        );
        setRecommendations(recs);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    loadRecommendations();
  }, [context, enhancedClientData, selectedVariant]);

  const handleRecommendationClick = (recommendation: string) => {
    setMessage(recommendation);
  };

  const getContextIcon = (contextType: string) => {
    switch (contextType) {
      case 'documentation':
        return <FileText className="h-4 w-4" />;
      case 'audit-actions':
        return <Settings className="h-4 w-4" />;
      case 'client-detail':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getContextDisplayName = (contextType: string) => {
    switch (contextType) {
      case 'documentation':
        return 'Dokumentanalyse';
      case 'audit-actions':
        return 'Revisjonshandlinger';
      case 'client-detail':
        return 'Klientdetaljer';
      case 'planning':
        return 'Planlegging';
      case 'execution':
        return 'Gjennomføring';
      case 'completion':
        return 'Avslutning';
      default:
        return 'Generell';
    }
  };

  return (
    <Card className={embedded ? '' : 'h-full'}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>AI-Revi Assistent</span>
            <Badge variant="outline" className="flex items-center gap-1">
              {getContextIcon(context)}
              {getContextDisplayName(context)}
            </Badge>
          </div>
          {selectedVariant && (
            <Badge variant="secondary" className="text-xs">
              {selectedVariant.display_name}
            </Badge>
          )}
        </CardTitle>
        
        {showVariantSelector && (
          <AIRevyVariantSelector 
            currentContext={context}
            onVariantChange={handleVariantChange}
            compact={embedded}
          />
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current tip display */}
        {currentTip && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">{currentTip}</div>
            </div>
          </div>
        )}

        {/* Contextual recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Lightbulb className="h-4 w-4" />
              Anbefalinger for {getContextDisplayName(context).toLowerCase()}
            </h4>
            <div className="space-y-1">
              {recommendations.map((rec, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRecommendationClick(rec)}
                  className="w-full justify-start h-auto text-left p-2 text-xs"
                  disabled={isLoadingRecommendations}
                >
                  <span className="text-blue-600 mr-2">•</span>
                  {rec}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className={embedded ? 'max-h-64 overflow-y-auto' : 'max-h-96 overflow-y-auto'}>
          <RevyMessageList 
            messages={messages}
            isTyping={isTyping}
          />
        </div>

        {/* Input - Fixed props to match RevyInputProps interface */}
        <RevyInput
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleSendMessage}
          isTyping={isTyping}
          placeholder={`Spør AI-Revi om ${getContextDisplayName(context).toLowerCase()}...`}
        />

        {/* Context information */}
        {enhancedClientData?.documentContext && (
          <div className="text-xs text-gray-500 border-t pt-2">
            <div className="flex items-center gap-4 text-xs">
              <span>{enhancedClientData.documentContext.documentStats.total} dokumenter</span>
              <span>Kvalitet: {enhancedClientData.documentContext.documentStats.qualityScore}%</span>
              {enhancedClientData.documentContext.subjectAreas.length > 0 && (
                <span>Områder: {enhancedClientData.documentContext.subjectAreas.slice(0, 2).join(', ')}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContextAwareRevyChat;
