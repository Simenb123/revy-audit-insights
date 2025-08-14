import { logger } from '@/utils/logger';

import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { RevyContext } from '@/types/revio';
import { AIClientData, AIClientDocument, AIHistoryMessage } from '@/types/revy-ai';
import { createTimeoutSignal } from '@/utils/networkHelpers';
import { contextSpecificHelp, errorMessages } from './fallbackMessages';

// Generate AI response using Supabase Edge Function with enhanced context and knowledge integration
export const generateAIResponse = async (
  message: string,
  context: RevyContext,
  history: AIHistoryMessage[],
  clientData?: AIClientData,
  userRole?: string,
  sessionId?: string,
  clientDocuments?: AIClientDocument[]
): Promise<string> => {
  if (!isSupabaseConfigured || !supabase) {
    logger.error("Supabase is not configured. AI response cannot proceed.");
    throw new Error("Supabase not initialized");
  }
  logger.log('🚀 Calling generateAIResponse service', {
    context,
    hasClientData: !!clientData,
    userRole,
    messageLength: message.length,
    historyLength: history.length,
    sessionId,
  });

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.error('❌ Authentication error in generateAIResponse:', userError?.message || 'No user found');
      throw new Error('Du må være logget inn for å bruke AI-assistenten');
    }

    logger.log('✅ User authenticated for AI call:', user.id);

    const simplifiedHistory = history.map(msg => ({ sender: msg.sender, content: msg.content }));

    const requestBody = {
      message,
      context,
      history: simplifiedHistory,
      clientData,
      userRole,
      sessionId,
      userId: user.id,
      clientDocuments: clientDocuments || []
    };

    logger.log('📤 Sending request to revy-ai-chat edge function', { sessionId });

    const { signal, clear } = createTimeoutSignal(20000);

    const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
      body: requestBody,
      signal
    } as any);

    clear();

    if (error) {
      logger.error('❌ Supabase function invocation error:', error);
      
      // More specific error handling
      if (error.message?.includes('FunctionsHttpError')) {
        return getFallbackResponse(context, 'service_unavailable');
      } else if (error.message?.includes('AuthError')) {
        throw new Error('Autorisasjonsfeil. Logg ut og inn igjen.');
      } else {
        const errorMessage = error.context?.msg || error.message || 'Ukjent feil fra AI-tjenesten';
        logger.log('🆘 Using fallback response for error:', errorMessage);
        return getFallbackResponse(context, 'ai_error', errorMessage);
      }
    }

    if (data?.isError) {
      logger.error('❌ Error response from AI function:', data.error);
      // Return the fallback response if it exists, otherwise use our fallback
      if (data.response) {
        return data.response;
      }
      return getFallbackResponse(context, 'ai_error', data.error);
    }

    if (!data || !data.response) {
      logger.error('❌ Invalid response structure from AI function:', data);
      return getFallbackResponse(context, 'general');
    }

    logger.log('✅ AI response received successfully', { responseLength: data.response.length, sessionId });
    return data.response;

  } catch (error: any) {
    logger.error('💥 Final catch block in generateAIResponse:', error);

    if (error.name === 'AbortError') {
      return 'Tilkoblingen tok for lang tid, prøv igjen senere';
    }
    
    // Enhanced fallback responses based on error type and context
    if (error instanceof Error) {
      if (error.message.includes('logget inn')) {
        throw error; // Re-throw auth errors as-is
      } else if (error.message.includes('utilgjengelig')) {
        return getFallbackResponse(context, 'service_unavailable');
      } else if (error.message.includes('AI-feil')) {
        return getFallbackResponse(context, 'ai_error');
      }
    }
    
    // Generic fallback
    return getFallbackResponse(context, 'general');
  }
};


// Enhanced fallback responses based on context with helpful revision guidance
const getFallbackResponse = (
  context: RevyContext,
  errorType: keyof typeof errorMessages,
  errorDetails?: string
): string => {
  const baseError = errorMessages[errorType] || errorMessages.general;
  const errorMsg =
    errorType === 'ai_error' && errorDetails ? `${baseError}: ${errorDetails}` : baseError;
  const contextHelp = contextSpecificHelp[context] || contextSpecificHelp.general;

  return `${errorMsg}\n\n${contextHelp}\n\n💡 **Tips:** Prøv igjen om noen minutter, eller kontakt support hvis problemet vedvarer. I mellomtiden kan du bruke veiledningen ovenfor til å fortsette med revisjonsarbeidet.`;
};
// Mock function for knowledge integration (to be implemented)
export const getRelevantKnowledge = async (query: string, context: RevyContext): Promise<string[]> => {
  if (!isSupabaseConfigured || !supabase) {
    logger.error('Supabase is not configured. Knowledge search cannot proceed.');
    return [];
  }

  try {
    logger.log('🔍 Fetching relevant knowledge articles', { query, context });

    const { signal, clear } = createTimeoutSignal(20000);

    const { data, error } = await supabase.functions.invoke('knowledge-search', {
      body: { query },
      signal
    } as any);

    clear();

    if (error) {
      logger.error('❌ Knowledge search error:', error);
      return [];
    }

    const articles = data?.articles || [];
    return articles.map((a: any) => a.title || String(a.id)).filter(Boolean);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.error('💥 Knowledge search timed out');
    } else {
      logger.error('💥 Knowledge search exception:', error);
    }
    return [];
  }
};
