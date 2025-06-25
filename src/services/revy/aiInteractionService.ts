
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { RevyContext, RevyChatMessage } from '@/types/revio';
import { log, error } from '@/utils/logger';

// Generate AI response using Supabase Edge Function with enhanced context and knowledge integration
export const generateAIResponse = async (
  message: string, 
  context: RevyContext,
  history: RevyChatMessage[],
  clientData?: any,
  userRole?: string,
  sessionId?: string
): Promise<string> => {
  if (!isSupabaseConfigured || !supabase) {
    error('Supabase is not configured. AI response cannot proceed.');
    throw new Error("Supabase not initialized");
  }
  log('🚀 Calling generateAIResponse service', {
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
      error('❌ Authentication error in generateAIResponse:', userError?.message || 'No user found');
      throw new Error('Du må være logget inn for å bruke AI-assistenten');
    }

    log('✅ User authenticated for AI call:', { userId: user.id });

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

    log('📤 Sending request to revy-ai-chat edge function');

    const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
      body: requestBody
    });

    if (error) {
      error('❌ Supabase function invocation error:', error);
      
      // More specific error handling
      if (error.message?.includes('FunctionsHttpError')) {
        return getFallbackResponse(context, 'service_unavailable');
      } else if (error.message?.includes('AuthError')) {
        throw new Error('Autorisasjonsfeil. Logg ut og inn igjen.');
      } else {
        const errorMessage = error.context?.msg || error.message || 'Ukjent feil fra AI-tjenesten';
        log('🆘 Using fallback response for error:', errorMessage);
        return getFallbackResponse(context, 'ai_error', errorMessage);
      }
    }

    if (data?.isError) {
      error('❌ Error response from AI function:', data.error);
      // Return the fallback response if it exists, otherwise use our fallback
      if (data.response) {
        return data.response;
      }
      return getFallbackResponse(context, 'ai_error', data.error);
    }

    if (!data || !data.response) {
      error('❌ Invalid response structure from AI function:', data);
      return getFallbackResponse(context, 'general');
    }

    log('✅ AI response received successfully', { responseLength: data.response.length });
    return data.response;

  } catch (error) {
    error('💥 Final catch block in generateAIResponse:', error);
    
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
const getFallbackResponse = (context: RevyContext, errorType: string, errorDetails?: string): string => {
  const baseMessage = "Beklager, jeg opplever tekniske problemer akkurat nå.";
  
  const contextSpecificHelp = {
    'risk-assessment': `I mellomtiden kan du se på ISA 315-standarden for risikovurdering og planlegge revisjonshandlinger basert på identifiserte risikoområder.

**Viktige risikoområder å vurdere:**
- Inntektsføring og omsetning
- Varelager og verdivurdering  
- Kundefordringer og tapsavsetninger
- Leverandørgjeld og periodiseringer
- Ledelsens skjønnsmessige vurderinger

**ISA 315 hovedkrav:**
- Forstå enheten og dens omgivelser
- Identifiser og vurder risiko for vesentlig feilinformasjon
- Evaluer internkontrollsystemer
- Dokumenter risikovurderinger grundig`,

    'documentation': `Du kan fortsette med dokumentasjon i henhold til ISA 230-kravene mens jeg blir tilgjengelig igjen.

**ISA 230 dokumentasjonskrav:**
- Tilstrekkelig og hensiktsmessig revisjonsbevis
- Dokumenter arten, tidspunktet og omfanget av revisjonshandlinger
- Resultater og konklusjoner av revisjonsarbeidet
- Betydelige profesjonelle vurderinger og grunnlaget for disse

**Dokumentasjonstips:**
- Bruk konsistente maler og strukturer
- Skriv klare og konsise konklusjoner
- Dokumenter avvik og oppfølgingshandlinger
- Sørg for sporbarhet og gjennomgåelsesmuligheter`,

    'client-detail': `Du kan gjennomgå klientinformasjon og tidligere revisjoner mens jeg løser tekniske problemer.

**Klientforståelse - nøkkelområder:**
- Bransje og markedsforhold
- Forretningsmodell og strategier
- Organisasjonsstruktur og ledelse
- IT-systemer og regnskapsprosesser
- Tidligere revisjoner og anbefalinger

**Planleggingsspørsmål:**
- Har det vært endringer i ledelse eller eierskap?
- Er det nye regnskapsstandarder som påvirker?
- Hvilke områder hadde feil i forrige revisjon?`,

    'collaboration': `Du kan koordinere med teamet ditt og fordele arbeidsoppgaver manuelt inntil systemet fungerer igjen.

**Teamkoordinering:**
- Organiser teammøter for oppgavefordeling
- Sett opp felles kalender for revisjonsaktiviteter
- Definer ansvarsområder og tidsfrister
- Etabler kommunikasjonskanaler for daglig oppfølging

**Kvalitetssikring:**
- Implementer review-prosesser mellom teammedlemmer
- Bruk sjekklister for kritiske revisjonsområder
- Dokumenter alle avklaringer og beslutninger`,

    'general': `Du kan fortsette med ditt revisjonsarbeid og komme tilbake til meg senere.

**Generelle revisjonstips:**
- Start med planlegging og risikovurdering
- Følg ISA-standardenes systematiske tilnærming
- Dokumenter alt revisjonsarbeid grundig
- Hold fokus på materialitet og risiko
- Kommuniser løpende med klient og team

**Nyttige ressurser:**
- ISA-håndbøker og veiledninger
- Bransjespesifikke revisjonsguider
- Regnskapsstandarder (NGRS/IFRS)
- Den norske revisorforeningens ressurser`
  };

  const errorMessages = {
    'service_unavailable': `${baseMessage} Tjenesten er midlertidig nede for vedlikehold.`,
    'ai_error': `${baseMessage} AI-modellen returnerte en feil${errorDetails ? `: ${errorDetails}` : ''}.`,
    'general': `${baseMessage} En teknisk feil oppstod.`
  };

  const errorMsg = errorMessages[errorType as keyof typeof errorMessages] || errorMessages.general;
  const contextHelp = contextSpecificHelp[context] || contextSpecificHelp.general;
  
  return `${errorMsg}\n\n${contextHelp}\n\n💡 **Tips:** Prøv igjen om noen minutter, eller kontakt support hvis problemet vedvarer. I mellomtiden kan du bruke veiledningen ovenfor til å fortsette med revisjonsarbeidet.`;
};

// Mock function for knowledge integration (to be implemented)
export const getRelevantKnowledge = async (query: string, context: RevyContext): Promise<string[]> => {
  // This would integrate with the knowledge base
  // For now, return empty array
  return [];
};
