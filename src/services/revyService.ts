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

// Enhanced AI-powered response generation with usage tracking
export const generateAIResponse = async (
  message: string,
  context: string = 'general',
  clientData?: any,
  userRole?: string,
  sessionId?: string
): Promise<string> => {
  try {
    console.log('🚀 Generating AI response...');
    
    // Get current session but don't fail if not authenticated
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    console.log('📋 AI Request details:', { 
      hasAuth: !!userId,
      context, 
      userRole,
      hasClientData: !!clientData 
    });

    const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
      body: {
        message,
        context,
        clientData,
        userRole,
        userId, // May be null for guest users
        sessionId
      }
    });

    if (error) {
      console.error('💥 Supabase function error:', error);
      throw new Error(`AI service error: ${error.message}`);
    }

    if (data.error) {
      console.error('💥 AI function returned error:', data.error);
      // Return the fallback response if provided
      return data.response || getLocalFallbackResponse(context, userRole);
    }

    console.log('✅ AI response received successfully');
    return data.response;
    
  } catch (error) {
    console.error('💥 Error in generateAIResponse:', error);
    return getLocalFallbackResponse(context, userRole);
  }
};

// Local fallback for when AI service is unavailable
const getLocalFallbackResponse = (context: string, userRole?: string): string => {
  const fallbacks = {
    'risk-assessment': 'Jeg har tekniske problemer, men her er noen generelle tips for risikovurdering: Start med å identifisere klientens bransje og nøkkelrisikoer. Vurder materialitetsnivå basert på størrelse og kompleksitet. Se ISA 315 for detaljerte retningslinjer.',
    'documentation': 'Tekniske problemer oppstått. For dokumentasjon, husk: ISA 230 krever at all dokumentasjon skal være tilstrekkelig og hensiktsmessig for å støtte revisjonskonklusjoner. Strukturer arbeidspapirene logisk og inkluder alle vesentlige vurderinger.',
    'client-detail': 'Midlertidig feil. For klientanalyse, se på nøkkeltall som omsetningsvekst, lønnsomhet og likviditet. Sammenlign med bransjegjennomsnitt og vurder trender over tid.',
    'collaboration': 'Teknisk feil. For teamarbeid: Sørg for klar rollefordeling, regelmessig kommunikasjon og dokumenterte beslutninger. Bruk standardiserte maler for konsistens.',
    'general': 'Jeg opplever tekniske problemer, men jeg er her for å hjelpe! Prøv igjen om litt, eller still spørsmål om revisjonsarbeid så skal jeg gjøre mitt beste for å hjelpe deg.'
  };
  
  const roleSpecific = userRole === 'partner' ? 
    ' Som partner bør du også vurdere klientporteføljens samlede risiko og strategiske implikasjoner.' :
    userRole === 'manager' ? 
    ' Som manager, sørg for at teamet følger etablerte prosedyrer og kvalitetsstandarder.' :
    ' Kontakt din manager hvis du trenger ytterligere veiledning eller støtte.';
  
  return (fallbacks[context as keyof typeof fallbacks] || fallbacks.general) + roleSpecific;
};

// Legacy function for backwards compatibility
export const generateResponse = (userMessage: string, context: RevyContext): string => {
  return getContextualTip(context);
};

// New function to fetch AI usage statistics
export const getAIUsageStats = async (timeframe: 'day' | 'week' | 'month' = 'week') => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      console.log('No authenticated user for AI usage stats');
      // Return empty stats instead of throwing error
      return {
        logs: [],
        summary: {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          avgResponseTime: 0,
          modelUsage: {},
          contextUsage: {}
        }
      };
    }

    let dateFilter = new Date();
    switch (timeframe) {
      case 'day':
        dateFilter.setDate(dateFilter.getDate() - 1);
        break;
      case 'week':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case 'month':
        dateFilter.setMonth(dateFilter.getMonth() - 1);
        break;
    }

    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select(`
        id,
        user_id,
        model,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        estimated_cost_usd,
        request_type,
        context_type,
        response_time_ms,
        created_at
      `)
      .eq('user_id', session?.user?.id)
      .gte('created_at', dateFilter.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AI usage stats:', error);
      return null;
    }

    // Calculate summary statistics
    const summary = {
      totalRequests: data.length,
      totalTokens: data.reduce((sum, log) => sum + log.total_tokens, 0),
      totalCost: data.reduce((sum, log) => sum + Number(log.estimated_cost_usd), 0),
      avgResponseTime: data.length > 0 
        ? data.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / data.length 
        : 0,
      modelUsage: data.reduce((acc, log) => {
        acc[log.model] = (acc[log.model] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      contextUsage: data.reduce((acc, log) => {
        acc[log.context_type || 'unknown'] = (acc[log.context_type || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return {
      logs: data,
      summary
    };
  } catch (error) {
    console.error('Error in getAIUsageStats:', error);
    // Return empty stats on error
    return {
      logs: [],
      summary: {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        avgResponseTime: 0,
        modelUsage: {},
        contextUsage: {}
      }
    };
  }
};

// Function to get firm-wide usage stats (for admins)
export const getFirmAIUsageStats = async (timeframe: 'day' | 'week' | 'month' = 'week') => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      console.log('No authenticated user for AI usage stats');
      // Return empty stats instead of throwing error
      return {
        logs: [],
        summary: {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          avgResponseTime: 0,
          modelUsage: {},
          contextUsage: {}
        }
      };
    }

    let dateFilter = new Date();
    switch (timeframe) {
      case 'day':
        dateFilter.setDate(dateFilter.getDate() - 1);
        break;
      case 'week':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case 'month':
        dateFilter.setMonth(dateFilter.getMonth() - 1);
        break;
    }

    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select(`
        id,
        user_id,
        model,
        total_tokens,
        estimated_cost_usd,
        request_type,
        context_type,
        response_time_ms,
        created_at,
        profiles!inner(first_name, last_name, user_role)
      `)
      .gte('created_at', dateFilter.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching firm AI usage stats:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getFirmAIUsageStats:', error);
    return null;
  }
};
