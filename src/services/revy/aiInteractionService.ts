
import { supabase } from '@/integrations/supabase/client';
import { RevyContext, RevyChatMessage } from '@/types/revio';

// Generate AI response using Supabase Edge Function with enhanced context and knowledge integration
export const generateAIResponse = async (
  message: string, 
  context: RevyContext,
  history: RevyChatMessage[],
  clientData?: any,
  userRole?: string,
  sessionId?: string
): Promise<string> => {
  console.log('🚀 Calling generateAIResponse service', {
    context,
    hasClientData: !!clientData,
    userRole,
    messageLength: message.length,
    historyLength: history.length,
  });

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Authentication error in generateAIResponse:', userError?.message || 'No user found');
      throw new Error('Du må være logget inn for å bruke AI-assistenten');
    }

    console.log('✅ User authenticated for AI call:', user.id);

    const simplifiedHistory = history.map(msg => ({ sender: msg.sender, content: msg.content }));

    const requestBody = {
      message,
      context,
      history: simplifiedHistory,
      clientData,
      userRole,
      sessionId,
      userId: user.id
    };

    console.log('📤 Sending request to revy-ai-chat edge function');

    const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
      body: requestBody
    });

    if (error) {
      console.error('❌ Supabase function invocation error:', error);
      
      // More specific error handling
      if (error.message?.includes('FunctionsHttpError')) {
        throw new Error('AI-tjenesten er midlertidig utilgjengelig. Prøv igjen om litt.');
      } else if (error.message?.includes('AuthError')) {
        throw new Error('Autorisasjonsfeil. Logg ut og inn igjen.');
      } else {
        const errorMessage = error.context?.msg || error.message || 'Ukjent feil fra AI-tjenesten';
        throw new Error(`AI-feil: ${errorMessage}`);
      }
    }

    if (data?.isError) {
      console.error('❌ Error response from AI function:', data.error);
      // Return the fallback response if it exists, otherwise throw
      if (data.response) {
        return data.response;
      }
      throw new Error(data.error || 'AI-assistenten opplevde en feil.');
    }

    if (!data || !data.response) {
      console.error('❌ Invalid response structure from AI function:', data);
      throw new Error('Ugyldig svar fra AI-tjenesten. Prøv igjen.');
    }

    console.log('✅ AI response received successfully', { responseLength: data.response.length });
    return data.response;

  } catch (error) {
    console.error('💥 Final catch block in generateAIResponse:', error);
    
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

// Enhanced fallback responses based on context
const getFallbackResponse = (context: RevyContext, errorType: string): string => {
  const baseMessage = "Beklager, jeg opplever tekniske problemer akkurat nå.";
  
  const contextSpecificHelp = {
    'risk-assessment': 'I mellomtiden kan du se på ISA 315-standarden for risikovurdering og planlegge revisjonshandlinger basert på identifiserte risikoområder.',
    'documentation': 'Du kan fortsette med dokumentasjon i henhold til ISA 230-kravene mens jeg blir tilgjengelig igjen.',
    'client-detail': 'Du kan gjennomgå klientinformasjon og tidligere revisjoner mens jeg løser tekniske problemer.',
    'collaboration': 'Du kan koordinere med teamet ditt og fordele arbeidsoppgaver manuelt inntil systemet fungerer igjen.',
    'general': 'Du kan fortsette med ditt revisjonsarbeid og komme tilbake til meg senere.'
  };

  const errorMessages = {
    'service_unavailable': `${baseMessage} Tjenesten er midlertidig nede for vedlikehold.`,
    'ai_error': `${baseMessage} AI-modellen returnerte en feil.`,
    'general': `${baseMessage} En ukjent feil oppstod.`
  };

  const errorMsg = errorMessages[errorType as keyof typeof errorMessages] || errorMessages.general;
  const contextHelp = contextSpecificHelp[context] || contextSpecificHelp.general;
  
  return `${errorMsg}\n\n${contextHelp}\n\n💡 Tips: Prøv igjen om noen minutter, eller kontakt support hvis problemet vedvarer.`;
};

// Mock function for knowledge integration (to be implemented)
export const getRelevantKnowledge = async (query: string, context: RevyContext): Promise<string[]> => {
  // This would integrate with the knowledge base
  // For now, return empty array
  return [];
};
