
import { generateAIResponse } from './aiInteractionService';
import { AIRevyVariant } from '@/hooks/useAIRevyVariants';
import { buildEnhancedAIPrompt, EnhancedAIContext } from '@/services/aiRevyVariantService';
import { RevyChatMessage } from '@/types/revio';

export interface ContextualAIRequest {
  message: string;
  context: string;
  clientData?: any;
  documentContext?: any;
  userRole?: string;
  sessionId?: string;
  variant?: AIRevyVariant;
}

export const generateEnhancedAIResponseWithVariant = async (
  message: string,
  context: string,
  messageHistory: RevyChatMessage[],
  clientData?: any,
  userRole?: string,
  sessionId?: string,
  variant?: AIRevyVariant
): Promise<string> => {
  try {
    // If no variant specified, use fallback to basic AI service
    if (!variant) {
      console.log('No AI variant specified, using basic AI service');
      return await generateAIResponse(message, context, messageHistory, clientData, userRole, sessionId);
    }

    // Build enhanced context for AI
    const enhancedContext: EnhancedAIContext = {
      variant,
      clientContext: clientData ? {
        phase: clientData.phase || 'execution',
        industry: clientData.industry || 'general',
        riskAreas: clientData.riskAreas || []
      } : undefined,
      userContext: {
        role: userRole || 'employee',
        experience: 'intermediate' // Could be derived from user profile
      }
    };

    // Add document context if available in clientData
    if (clientData?.documentContext) {
      enhancedContext.documentContext = clientData.documentContext;
    }

    // Build enhanced prompt
    const enhancedPrompt = buildEnhancedAIPrompt(variant, message, enhancedContext);

    console.log('Using enhanced AI prompt with variant:', variant.name);
    console.log('Enhanced context:', enhancedContext);

    // Generate response using enhanced prompt
    const response = await generateAIResponse(
      enhancedPrompt, 
      context, 
      messageHistory, 
      clientData, 
      userRole, 
      sessionId
    );

    return response;
    
  } catch (error) {
    console.error('Enhanced AI response generation failed:', error);
    
    // Fallback to basic AI service
    console.log('Falling back to basic AI service');
    return await generateAIResponse(message, context, messageHistory, clientData, userRole, sessionId);
  }
};

export const getContextualRecommendations = async (
  context: string,
  clientData?: any,
  userRole?: string,
  variant?: AIRevyVariant
): Promise<string[]> => {
  try {
    const recommendationPrompt = `Basert på konteksten "${context}" og klientdata, gi 3-5 korte anbefalinger for hva brukeren bør fokusere på nå.`;
    
    const response = await generateEnhancedAIResponseWithVariant(
      recommendationPrompt,
      context,
      [],
      clientData,
      userRole,
      undefined,
      variant
    );

    // Parse recommendations from response
    const recommendations = response
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^[-•\d\.]\s*/, '').trim())
      .filter(rec => rec.length > 0)
      .slice(0, 5);

    return recommendations.length > 0 ? recommendations : [
      'Gjennomgå dokumenter for kvalitetssikring',
      'Oppdater revisjonshandlinger basert på funn',
      'Verifiser at alle påkrevde dokumenter er tilgjengelige'
    ];
    
  } catch (error) {
    console.error('Failed to get contextual recommendations:', error);
    return [
      'Gjennomgå dokumenter for kvalitetssikring',
      'Oppdater revisjonshandlinger basert på funn',
      'Verifiser at alle påkrevde dokumenter er tilgjengelige'
    ];
  }
};
