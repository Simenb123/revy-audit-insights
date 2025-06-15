import { supabase } from '@/integrations/supabase/client';
import { RevyContext } from '@/types/revio';

// Generate AI response using Supabase Edge Function with enhanced context and knowledge integration
export const generateAIResponse = async (
  message: string, 
  context: RevyContext,
  clientData?: any,
  userRole?: string,
  sessionId?: string
): Promise<string> => {
  console.log('🚀 Calling generateAIResponse service', {
    context,
    hasClientData: !!clientData,
    userRole,
    messageLength: message.length
  });

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Authentication error in generateAIResponse:', userError?.message || 'No user found');
      throw new Error('Authentication required');
    }

    console.log('✅ User authenticated for AI call:', user.id);

    const requestBody = {
      message,
      context,
      clientData,
      userRole,
      sessionId,
      userId: user.id // Ensure userId is properly set as string
    };

    console.log('📤 Sending request to revy-ai-chat edge function with body:', requestBody);

    const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
      body: requestBody
    });

    if (error) {
      console.error('❌ Supabase function invocation error:', error);
      const errorMessage = error.context?.msg || error.message || 'Unknown function error';
      throw new Error(errorMessage);
    }

    if (data.isError) {
        console.error('❌ Error response from AI function:', data.error);
        throw new Error(data.response || data.error || 'The AI assistant encountered an error.');
    }

    if (!data || !data.response) {
      console.error('❌ Invalid response structure from AI function:', data);
      throw new Error('Invalid response from AI service');
    }

    console.log('✅ AI response received successfully', { responseLength: data.response.length });
    return data.response;

  } catch (error) {
    console.error('💥 Final catch block in generateAIResponse:', error);
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred while contacting the AI assistant.');
  }
};

// Get AI usage statistics for current user
export const getAIUsageStats = async (timeframe: 'day' | 'week' | 'month' = 'week') => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AI usage stats:', error);
      throw error;
    }

    // Calculate summary statistics
    const summary = {
      totalRequests: logs?.length || 0,
      totalTokens: logs?.reduce((sum, log) => sum + (log.total_tokens || 0), 0) || 0,
      totalCost: logs?.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0) || 0,
      avgResponseTime: logs?.length ? 
        logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / logs.length : 0,
      modelUsage: logs?.reduce((acc, log) => {
        acc[log.model] = (acc[log.model] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      contextUsage: logs?.reduce((acc, log) => {
        const context = log.context_type || 'general';
        acc[context] = (acc[context] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    return {
      logs: logs || [],
      summary
    };
  } catch (error) {
    console.error('Error in getAIUsageStats:', error);
    throw error;
  }
};

// Get firm-wide AI usage statistics (admin only)
export const getFirmAIUsageStats = async (timeframe: 'day' | 'week' | 'month' = 'week') => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          user_role
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching firm AI usage stats:', error);
      throw error;
    }

    return logs || [];
  } catch (error) {
    console.error('Error in getFirmAIUsageStats:', error);
    throw error;
  }
};

// Get contextual tips based on current context
export const getContextualTip = (context: RevyContext): string => {
  const tips: Record<RevyContext, string> = {
    'dashboard': 'Her kan du spørre om oversikten over dine klienter, oppgaver eller revisjonsstatistikk.',
    'drill-down': 'Jeg kan hjelpe deg med å analysere regnskapsdata, identifisere avvik eller forklare kontodetaljer.',
    'risk-assessment': 'Spør meg om risikoanalyse, vesentlighetsvurderinger eller revisjonsstrategier.',
    'documentation': 'Jeg kan hjelpe med dokumentasjon av revisjonshandlinger, notater eller rapporter.',
    'mapping': 'Trenger du hjelp med kontoplanmapping, kategorisering eller dataimport?',
    'client-overview': 'Jeg kan gi deg innsikt i klientens finansielle stilling, nøkkeltall eller historikk.',
    'client-detail': 'Spør meg om spesifikke detaljer for denne klienten, revisjonshistorikk eller teamsamarbeid.',
    'collaboration': 'Jeg kan hjelpe med teamsamarbeid, oppgavedeling eller kommunikasjon med klienter.',
    'communication': 'Trenger du hjelp med meldinger, møtenotater eller klientkommunikasjon?',
    'audit-actions': 'Jeg kan forklare revisjonshandlinger, hjelpe med planlegging eller statusoppfølging.',
    'team-management': 'Spør meg om teamorganisering, kapasitetsplanlegging eller kompetanseutvikling.',
    'accounting-data': 'Her kan du spørre om analyse av kontoer, transaksjoner eller periodesammenligninger.',
    'analysis': 'Spør meg om å tolke grafer, beregne nøkkeltall eller identifisere trender.',
    'data-upload': 'Trenger du hjelp med å laste opp regnskapsdata eller filformater?',
    'knowledge-base': 'Søk etter faglige temaer, ISA-standarder eller spør meg direkte.',
    'general': 'Jeg kan hjelpe deg med revisjonsfaglige spørsmål, prosedyrer eller faglige retningslinjer.'
  };
  
  return tips[context] || tips.general;
};

// Mock function for knowledge integration (to be implemented)
export const getRelevantKnowledge = async (query: string, context: RevyContext): Promise<string[]> => {
  // This would integrate with the knowledge base
  // For now, return empty array
  return [];
};
