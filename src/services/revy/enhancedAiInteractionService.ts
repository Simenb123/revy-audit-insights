
import { supabase } from '@/integrations/supabase/client';
import { RevyChatMessage } from '@/types/revio';
import { generateSmartDocumentPrompt } from '@/services/documentAIService';

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
      messageLength: userMessage.length
    });

    // Build enhanced context for better responses
    const enhancedPrompt = buildEnhancedSystemPrompt(
      context,
      clientData,
      userRole,
      selectedVariant
    );

    // Prepare chat history in the correct format
    const formattedHistory = chatHistory.map(msg => ({
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.created_at
    }));

    // Call the AI service
    const response = await supabase.functions.invoke('revy-ai-chat', {
      body: {
        message: userMessage,
        context,
        history: formattedHistory,
        clientData,
        userRole,
        sessionId,
        variant: selectedVariant
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data?.response || 'Beklager, jeg kunne ikke generere et svar akkurat nå.';

  } catch (error) {
    console.error('Enhanced AI response generation failed:', error);
    return getFallbackResponse(context, userMessage);
  }
};

// Export the alias for backward compatibility
export const generateEnhancedAIResponse = generateEnhancedAIResponseWithVariant;

const buildEnhancedSystemPrompt = (
  context: string,
  clientData?: any,
  userRole?: string,
  selectedVariant?: any
): string => {
  let basePrompt = `Du er AI-Revi, en ekspert AI-assistent for revisjon og regnskapsføring. Du hjelper revisorer med praktiske oppgaver og gir konkrete, handlingsrettede råd.

KONTEKST: ${getContextDisplayName(context)}
BRUKERROLLE: ${userRole || 'Ansatt'}`;

  // Add variant-specific instructions
  if (selectedVariant?.system_prompt_template) {
    basePrompt += `\n\nSPESIALISTINSTRUKSJONER (${selectedVariant.display_name}):\n${selectedVariant.system_prompt_template}`;
  }

  // Add context-specific instructions
  switch (context) {
    case 'documentation':
      basePrompt += `\n\nDOKUMENTKONTEKST:
- Fokuser på dokumentanalyse, kategorisering og kvalitetssikring
- Gi konkrete forslag til forbedringer
- Identifiser manglende dokumenter eller kategorier
- Hjelp med organisering og struktur
- Foreslå relevante revisjonshandlinger basert på dokumenter`;
      break;
      
    case 'audit-actions':
      basePrompt += `\n\nREVISJONSHANDLINGER:
- Hjelp med planlegging og gjennomføring av revisjonshandlinger
- Foreslå handlinger basert på risikovurdering
- Gi veiledning om ISA-standarder
- Hjelp med dokumentasjonskrav
- Kvalitetssikring av arbeid`;
      break;
      
    case 'client-detail':
      basePrompt += `\n\nKLIENTDETALJER:
- Analyser klientinformasjon og identifiser risikoområder
- Foreslå tilpassede revisjonsstrategier
- Hjelp med bransjeforståelse
- Identifiser kompleksitetsområder
- Gi råd om ressursallokering`;
      break;
  }

  // Add client-specific context
  if (clientData) {
    basePrompt += `\n\nKLIENTINFORMASJON:
- Selskap: ${clientData.company_name || clientData.name}
- Bransje: ${clientData.industry || 'Ikke spesifisert'}
- Fase: ${clientData.phase || 'Ikke spesifisert'}`;
    
    if (clientData.documentContext) {
      const stats = clientData.documentContext.documentStats;
      basePrompt += `\n- Dokumenter: ${stats.total} totalt, ${stats.qualityScore}% kvalitetsscore`;
    }
  }

  basePrompt += `\n\nINSTRUKSJONER:
1. Gi alltid konkrete, handlingsrettede råd
2. Referer til relevante ISA-standarder når relevant
3. Bruk norsk revisjonsterminologi
4. Vær presis og profesjonell
5. Foreslå neste steg eller oppfølgingshandlinger
6. Tilpass svaret til brukerens kompetansenivå og rolle

Svar på norsk med mindre brukeren spør på engelsk.`;

  return basePrompt;
};

const getContextDisplayName = (context: string): string => {
  switch (context) {
    case 'documentation': return 'Dokumentanalyse';
    case 'audit-actions': return 'Revisjonshandlinger';
    case 'client-detail': return 'Klientdetaljer';
    case 'planning': return 'Planlegging';
    case 'execution': return 'Gjennomføring';
    case 'completion': return 'Avslutning';
    default: return 'Generell assistanse';
  }
};

const getFallbackResponse = (context: string, userMessage: string): string => {
  const contextResponses = {
    documentation: 'Jeg kan hjelpe deg med dokumentanalyse og kategorisering. Kan du være mer spesifikk om hva du trenger hjelp med?',
    'audit-actions': 'Jeg kan veilede deg om revisjonshandlinger og ISA-standarder. Hvilket område vil du fokusere på?',
    'client-detail': 'Jeg kan analysere klientinformasjon og foreslå revisjonsstrategier. Hva vil du vite mer om?'
  };

  return contextResponses[context as keyof typeof contextResponses] || 
    'Jeg er her for å hjelpe deg med revisjon og regnskapsføring. Kan du utdype spørsmålet ditt?';
};
