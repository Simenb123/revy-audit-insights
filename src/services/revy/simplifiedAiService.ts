
import { supabase } from '@/integrations/supabase/client';
import { RevyContext } from '@/types/revio';

interface SimpleAIResponse {
  response: string;
  error?: string;
}

// Simple cache for responses
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const generateCacheKey = (message: string, context: string, clientId?: string): string => {
  return btoa(`${message}-${context}-${clientId || ''}`).replace(/[^a-zA-Z0-9]/g, '');
};

const getCachedResponse = (key: string): string | null => {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.response;
  }
  responseCache.delete(key);
  return null;
};

const cacheResponse = (key: string, response: string): void => {
  responseCache.set(key, { response, timestamp: Date.now() });
};

export const generateSimpleAIResponse = async (
  message: string,
  context: RevyContext,
  history: any[] = [],
  clientData?: any,
  userRole?: string,
  sessionId?: string,
  selectedVariant?: any
): Promise<string> => {
  const startTime = Date.now();
  
  try {
    console.log('🤖 Simple AI request:', {
      message: message.substring(0, 50) + '...',
      context,
      userRole,
      hasClientData: !!clientData,
      historyLength: history.length,
      variantName: selectedVariant?.name || 'default'
    });

    // Check cache first
    const cacheKey = generateCacheKey(message, context, clientData?.id);
    const cachedResponse = getCachedResponse(cacheKey);
    
    if (cachedResponse) {
      console.log('💾 Using cached response');
      return cachedResponse;
    }

    // Get current user for logging
    const { data: { user } } = await supabase.auth.getUser();

    // Call the revy-ai-chat function with simplified parameters
    const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
      body: {
        message,
        context,
        history: history.slice(-6), // Keep only last 6 messages for context
        clientData,
        userRole,
        sessionId,
        userId: user?.id,
        variant: selectedVariant
      }
    });

    if (error) {
      throw new Error(`AI function error: ${error.message || 'Unknown error'}`);
    }

    if (data?.isError) {
      console.error('❌ Error from AI function:', data.error);
      return data.response || getFallbackResponse(context);
    }

    const aiResponse = data?.response || getFallbackResponse(context);
    const responseTime = Date.now() - startTime;

    console.log('✅ Simple AI response generated:', {
      responseLength: aiResponse.length,
      responseTime: `${responseTime}ms`,
      hasVariant: !!selectedVariant
    });

    // Cache the response
    cacheResponse(cacheKey, aiResponse);

    return aiResponse;

  } catch (error) {
    console.error('💥 Simple AI response failed:', error);
    return getFallbackResponse(context, error.message);
  }
};

const getFallbackResponse = (context: RevyContext, errorMessage?: string): string => {
  const baseMessage = "Beklager, jeg opplever tekniske problemer akkurat nå.";
  
  const contextHelp = {
    'client-detail': 'Du kan fortsette med å gjennomgå klientinformasjon manuelt.',
    'documentation': 'Du kan fortsette med dokumentgjennomgang i henhold til ISA 230.',
    'risk-assessment': 'Du kan starte med risikovurdering basert på ISA 315.',
    'audit-actions': 'Du kan planlegge revisjonshandlinger manuelt.',
    'general': 'Prøv igjen om noen minutter.'
  };

  const help = contextHelp[context] || contextHelp.general;
  
  let response = `${baseMessage} ${help}`;
  
  if (errorMessage) {
    response += `\n\nTeknisk feil: ${errorMessage}`;
  }
  
  response += '\n\n🏷️ **EMNER:** Teknisk support, Feilsøking';
  
  return response;
};
