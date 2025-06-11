
import { RevyContext, RevyMessage } from '@/types/revio';
import { supabase } from '@/integrations/supabase/client';

// Context-aware tips for Revy assistant (fallback hvis AI feiler)
const contextualTips: Record<string, string[]> = {
  'dashboard': [
    'Velkommen til dashbordet! Her ser du en oversikt over nøkkeltall for klienten.',
    'Klikk på en regnskapslinje i oversikten for å se detaljene.',
    'Ser du de røde indikatorene? Det kan tyde på høyrisiko-områder som krever oppmerksomhet.',
    'Husker du å sjekke endringen fra forrige periode? Store svingninger kan være risikoindikatorer.'
  ],
  'client-overview': [
    'Her ser du alle klientene du er ansvarlig for.',
    'Klikk på en klient for å se detaljer og revisjonsstatus.',
    'Legg merke til varslene som indikerer kritiske datoer eller manglende dokumentasjon.',
    'Bruk filterfunksjonen for å sortere klienter etter bransje eller revisjonsfase.'
  ],
  'collaboration': [
    'Samarbeidsverktøyene hjelper deg å koordinere med teamet ditt.',
    'Bruk arbeidsområder for å organisere dokumenter og diskusjoner per klient.',
    'Videomøter og chat gjør det enkelt å holde kontakt med kolleger.',
    'Husk å dokumentere viktige beslutninger fra teammøter.'
  ],
  'general': [
    'Jeg er Revy, din revisjonsassistent! Spør meg om hjelp når som helst.',
    'Trenger du hjelp med noe spesifikt? Jeg kan veilede deg gjennom revisjonsprosessen.',
    'Tips: Bruk søkefunksjonen øverst for å finne dokumenter eller revisjonssteg.',
    'Husk å lagre arbeidet ditt regelmessig!'
  ]
};

// Get contextual tip based on current context (fallback)
export const getContextualTip = (context: RevyContext): string => {
  const tips = contextualTips[context as string] || contextualTips['general'];
  return tips[Math.floor(Math.random() * tips.length)];
};

// Enhanced AI-powered response generation
export const generateAIResponse = async (
  userMessage: string, 
  context: RevyContext,
  clientData?: any,
  userRole?: string
): Promise<string> => {
  try {
    console.log('Generating AI response for:', { userMessage, context, userRole });
    
    const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
      body: {
        message: userMessage,
        context: context,
        clientData: clientData,
        userRole: userRole || 'employee'
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (data?.response) {
      console.log('AI response received successfully');
      return data.response;
    } else {
      throw new Error('No response from AI');
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    // Fallback to contextual tips
    return getContextualTip(context);
  }
};

// Legacy function for backwards compatibility
export const generateResponse = (userMessage: string, context: RevyContext): string => {
  return getContextualTip(context);
};
