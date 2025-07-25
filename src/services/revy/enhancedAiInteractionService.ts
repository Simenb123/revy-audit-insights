import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/revio';

export interface AIVariant {
  id: string;
  name: string;
  display_name: string;
  description: string;
  system_prompt_prefix: string;
  model_config: {
    temperature: number;
    max_tokens: number;
    model: string;
  };
  context_types: string[];
}

export async function generateEnhancedAIResponseWithVariant(
  message: string,
  context: string,
  history: any[],
  clientData?: Client,
  userRole?: string,
  sessionId?: string,
  selectedVariant?: AIVariant
): Promise<string> {
  try {
    logger.log('🚀 Enhanced AI interaction starting with variant:', selectedVariant?.name);
    
    // Build enhanced context with client data and document status
    const enhancedContext = buildEnhancedContext(context, clientData, userRole);
    
    // Prepare request data
    const requestData = {
      message,
      context: enhancedContext,
      history: history.slice(-5), // Keep last 5 messages for context
      clientData: clientData ? {
        id: clientData.id,
        name: clientData.name,
        industry: clientData.industry,
        company_name: clientData.company_name,
        has_documents: calculateDocumentQualityScore(clientData) > 0,
        document_quality_score: calculateDocumentQualityScore(clientData),
        risk_profile: determineRiskProfile(clientData)
      } : undefined,
      userRole,
      sessionId,
      variantName: selectedVariant?.name || 'default',
      variantConfig: selectedVariant ? {
        temperature: selectedVariant.model_config.temperature,
        max_tokens: selectedVariant.model_config.max_tokens,
        model: selectedVariant.model_config.model,
        system_prompt_prefix: selectedVariant.system_prompt_prefix
      } : undefined
    };

    logger.log('📤 Sending enhanced request to AI service');
    
    const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
      body: requestData
    });

    if (error) {
      logger.error('❌ Enhanced AI interaction failed:', error);
      return getEnhancedFallbackResponse(context, error.message, selectedVariant);
    }

    if (!data?.response) {
      logger.warn('⚠️ No response from enhanced AI service');
      return getEnhancedFallbackResponse(context, 'No response', selectedVariant);
    }

    logger.log('✅ Enhanced AI response received successfully');
    return data.response;

  } catch (error) {
    logger.error('💥 Enhanced AI interaction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return getEnhancedFallbackResponse(context, errorMessage, selectedVariant);
  }
}

function buildEnhancedContext(context: string, clientData?: Client, userRole?: string): string {
  let enhancedContext = context;
  
  if (clientData) {
    const qualityScore = calculateDocumentQualityScore(clientData);
    const documentStatus = qualityScore > 0 ? 'har dokumenter' : 'mangler dokumenter';
    
    enhancedContext += `_client_enhanced:${clientData.name}_documents:${documentStatus}_quality:${qualityScore}`;
  }
  
  if (userRole) {
    enhancedContext += `_role:${userRole}`;
  }
  
  return enhancedContext;
}

function calculateDocumentQualityScore(client: Client): number {
  // Simple scoring based on available client data
  let score = 0;
  
  // Basic score for having client data
  if (client.name) score += 20;
  if (client.company_name) score += 20;
  if (client.industry) score += 30;
  if (client.org_number) score += 30;
  
  return Math.min(score, 100);
}

function determineRiskProfile(client: Client): 'low' | 'medium' | 'high' {
  const factors = [
    !client.company_name, // Missing company name = higher risk
    !client.industry, // No industry = higher risk
    calculateDocumentQualityScore(client) < 50 // Low quality data = higher risk
  ];
  
  const riskFactors = factors.filter(Boolean).length;
  
  if (riskFactors >= 2) return 'high';
  if (riskFactors >= 1) return 'medium';
  return 'low';
}

function getEnhancedFallbackResponse(context: string, errorType: string, selectedVariant?: AIVariant): string {
  const variantName = selectedVariant?.display_name || 'AI-Revy';
  
  const fallbacks: Record<string, string> = {
    'audit-actions': `Beklager, ${variantName} er ikke tilgjengelig akkurat nå. For revisjonshandlinger kan du:
    
• Sjekke ISA-standardene direkte
• Se eksisterende arbeidspapirsaker 
• Kontakte en kollega for veiledning
• Prøv igjen om litt

Feil: ${errorType}`,

    'documentation': `Beklager, ${variantName} er ikke tilgjengelig akkurat nå. For dokumentanalyse kan du:
    
• Bruke standard sjekklister
• Se tidligere lignende klienter
• Kontrollere dokumentkrav manuelt
• Prøv igjen om litt

Feil: ${errorType}`,

    'client-detail': `Beklager, ${variantName} er ikke tilgjengelig akkurat nå. For klientanalyse kan du:
    
• Sjekke regnskapsdataene direkte
• Se historiske revisjonsnotater
• Kontrollere bransjetall manuelt
• Prøv igjen om litt

Feil: ${errorType}`,

    'default': `Beklager, ${variantName} er ikke tilgjengelig akkurat nå. Du kan:
    
• Prøve igjen om litt
• Sjekke kunnskapsbasen manuelt
• Kontakte support hvis problemet vedvarer

Feil: ${errorType}`
  };

  return fallbacks[context] || fallbacks['default'];
}