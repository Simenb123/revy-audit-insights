
import { supabase } from '@/integrations/supabase/client';
import { RevyChatMessage } from '@/types/revio';

export const generateEnhancedAIResponseWithVariant = async (
  userMessage: string,
  context: string,
  chatHistory: RevyChatMessage[],
  clientData?: any,
  userRole?: string,
  sessionId?: string,
  selectedVariant?: any
): Promise<string> => {
  try {
    console.log('🚀 Generating enhanced AI response with variant:', {
      context,
      userRole,
      variantName: selectedVariant?.name,
      messageLength: userMessage.length,
      hasClientData: !!clientData
    });

    // Prepare chat history in the correct format
    const formattedHistory = chatHistory.map(msg => ({
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.created_at
    }));

    // Get current user for authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Authentication error in enhanced AI response:', userError?.message || 'No user found');
      throw new Error('Du må være logget inn for å bruke AI-assistenten');
    }

    // Enhanced request body with variant support
    const requestBody = {
      message: userMessage,
      context,
      history: formattedHistory,
      clientData,
      userRole,
      sessionId,
      userId: user.id,
      variant: selectedVariant // Pass the full variant object
    };

    console.log('📤 Sending enhanced request with variant to revy-ai-chat edge function:', {
      variantName: selectedVariant?.name,
      contextType: context,
      hasVariantPrompt: !!selectedVariant?.system_prompt_template
    });

    // Call the enhanced AI service
    const response = await supabase.functions.invoke('revy-ai-chat', {
      body: requestBody
    });

    if (response.error) {
      console.error('❌ Enhanced AI service error:', response.error);
      throw new Error(response.error.message || 'AI-tjenesten returnerte en feil');
    }

    if (response.data?.isError) {
      console.error('❌ AI function returned error:', response.data.error);
      return response.data.response || getFallbackResponse(context, userMessage, selectedVariant);
    }

    if (!response.data || !response.data.response) {
      console.error('❌ Invalid response structure from enhanced AI function:', response.data);
      return getFallbackResponse(context, userMessage, selectedVariant);
    }

    console.log('✅ Enhanced AI response received successfully with variant support:', { 
      responseLength: response.data.response.length,
      variantUsed: selectedVariant?.name || 'default'
    });

    return response.data.response;

  } catch (error) {
    console.error('💥 Enhanced AI response generation failed:', error);
    return getFallbackResponse(context, userMessage, selectedVariant);
  }
};

// Export the alias for backward compatibility
export const generateEnhancedAIResponse = generateEnhancedAIResponseWithVariant;

// Enhanced fallback response with variant awareness
const getFallbackResponse = (context: string, userMessage: string, selectedVariant?: any): string => {
  const baseMessage = "Beklager, jeg opplever tekniske problemer akkurat nå.";
  
  let variantSpecificHelp = '';
  if (selectedVariant) {
    switch (selectedVariant.name) {
      case 'methodology-expert':
        variantSpecificHelp = `Som din metodikk-ekspert kan jeg normalt hjelpe med:
- ISA-standarder og revisjonsmetodikk
- Faglige prosedyrer og best practice
- Systematiske tilnærminger til revisjon
- Kvalitetssikring av revisjonsarbeid`;
        break;
      case 'professional-knowledge':
        variantSpecificHelp = `Som din fagekspert kan jeg normalt hjelpe med:
- Dybdegående fagkunnskap om revisjon
- Regnskapsføring og standarder
- Lovverk og forskrifter
- Teoretiske aspekter og faglig forståelse`;
        break;
      case 'client-guide':
        variantSpecificHelp = `Som din klient-veileder kan jeg normalt hjelpe med:
- Praktisk gjennomføring av denne klientens revisjon
- Klient-spesifikke utfordringer og løsninger
- Prioritering av revisjonshandlinger
- Neste steg i revisjonsprosessen`;
        break;
      case 'technical-support':
        variantSpecificHelp = `Som din tekniske støtte kan jeg normalt hjelpe med:
- Veiledning om systemfunksjoner
- Feilsøking og problemer
- Arbeidsflyt og beste praksis
- Praktisk bruk av verktøyene`;
        break;
    }
  }

  const contextSpecificHelp = {
    'risk-assessment': 'I mellomtiden kan du se på ISA 315-standarden for risikovurdering og planlegge revisjonshandlinger basert på identifiserte risikoområder.',
    'documentation': 'Du kan fortsette med dokumentasjon i henhold til ISA 230-kravene mens jeg blir tilgjengelig igjen.',
    'client-detail': 'Du kan gjennomgå klientinformasjon og tidligere revisjoner mens jeg løser tekniske problemer.',
    'general': 'Du kan fortsette med ditt revisjonsarbeid og komme tilbake til meg senere.'
  };

  const contextHelp = contextSpecificHelp[context as keyof typeof contextSpecificHelp] || contextSpecificHelp.general;
  
  let response = `${baseMessage}`;
  
  if (variantSpecificHelp) {
    response += `\n\n${variantSpecificHelp}`;
  }
  
  response += `\n\n${contextHelp}`;
  response += `\n\n💡 **Tips:** Prøv igjen om noen minutter, eller kontakt support hvis problemet vedvarer.`;
  response += `\n\n🏷️ **EMNER:** Feilmeldinger, Support, ${selectedVariant?.name || 'Generell'} assistanse`;
  
  return response;
};
