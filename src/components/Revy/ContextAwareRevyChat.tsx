
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, MessageSquare, Lightbulb, FileText, Settings } from 'lucide-react';
import { useSmartReviAssistant } from '@/hooks/revy/useSmartRevyAssistant';
import { useAIRevyVariants } from '@/hooks/useAIRevyVariants';
import { useEnhancedClientDocuments } from '@/hooks/useEnhancedClientDocuments';
import { getContextualDocumentSuggestions } from '@/services/documentAIService';
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
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  const { selectedVariant, handleVariantChange } = useAIRevyVariants(context);
  const { getDocumentContext, documents } = useEnhancedClientDocuments(clientId || '');
  
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

  // Load smart document suggestions - Fix type issue by converting to the expected format
  useEffect(() => {
    const loadSmartSuggestions = async () => {
      if (context !== 'documentation' || !documents) return;
      
      setIsLoadingSuggestions(true);
      try {
        // Convert EnhancedClientDocument[] to ClientDocument[] format expected by the service
        const clientDocuments = documents.map(doc => ({
          id: doc.id,
          client_id: clientId || '',
          user_id: '',
          file_name: doc.file_name,
          file_path: '',
          file_size: 0,
          mime_type: '',
          category: doc.category,
          subject_area: '',
          ai_suggested_category: '',
          ai_confidence_score: doc.ai_confidence_score,
          ai_analysis_summary: doc.ai_analysis_summary,
          manual_category_override: false,
          created_at: doc.created_at,
          updated_at: doc.created_at,
          extracted_text: doc.extracted_text,
          text_extraction_status: 'completed'
        }));
        
        const suggestions = await getContextualDocumentSuggestions('', clientDocuments, context);
        setSmartSuggestions(suggestions);
      } catch (error) {
        console.error('Failed to load smart suggestions:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    loadSmartSuggestions();
  }, [context, documents, clientId]);

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
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

        {/* Smart document suggestions */}
        {smartSuggestions.length > 0 && context === 'documentation' && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Brain className="h-4 w-4" />
              Smarte forslag
            </h4>
            <div className="space-y-1">
              {smartSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full justify-start h-auto text-left p-2 text-xs"
                  disabled={isLoadingSuggestions}
                >
                  <span className="text-purple-600 mr-2">•</span>
                  {suggestion}
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

        {/* Input */}
        <RevyInput
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleSendMessage}
          isTyping={isTyping}
          isEmbedded={embedded}
          placeholder={`Spør AI-Revi om ${getContextDisplayName(context).toLowerCase()}...`}
        />

        {/* Enhanced context information */}
        {enhancedClientData?.documentContext && (
          <div className="text-xs text-gray-500 border-t pt-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>{enhancedClientData.documentContext.documentStats.total} dokumenter</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                <span>Kvalitet: {enhancedClientData.documentContext.documentStats.qualityScore}%</span>
              </div>
              {enhancedClientData.documentContext.categories.length > 0 && (
                <div className="col-span-2 flex items-center gap-1">
                  <span>Kategorier: {enhancedClientData.documentContext.categories.slice(0, 2).join(', ')}</span>
                  {enhancedClientData.documentContext.categories.length > 2 && (
                    <span>+{enhancedClientData.documentContext.categories.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContextAwareRevyChat;
