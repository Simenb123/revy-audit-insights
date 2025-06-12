
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
  console.log('🔍 Generating enhanced AI response with knowledge integration', {
    context,
    hasClientData: !!clientData,
    userRole,
    messageLength: message.length
  });

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ Error getting user:', userError);
      throw new Error('Authentication required');
    }

    if (!user) {
      console.error('❌ No authenticated user found');
      throw new Error('User not authenticated');
    }

    console.log('✅ User authenticated:', user.id);

    const requestBody = {
      message,
      context,
      clientData,
      userRole,
      sessionId,
      userId: user.id // Ensure userId is properly set as string
    };

    console.log('📤 Sending request to edge function:', {
      ...requestBody,
      userId: user.id,
      messagePreview: message.substring(0, 50) + '...'
    });

    const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
      body: requestBody
    });

    if (error) {
      console.error('❌ Supabase function error:', error);
      throw error;
    }

    if (!data || !data.response) {
      console.error('❌ Invalid response from AI function:', data);
      throw new Error('Invalid response from AI service');
    }

    console.log('✅ AI response received successfully');
    return data.response;

  } catch (error) {
    console.error('💥 Error in generateAIResponse:', error);
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
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
