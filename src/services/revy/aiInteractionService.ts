
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
      throw new Error('Authentication required');
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

// Mock function for knowledge integration (to be implemented)
export const getRelevantKnowledge = async (query: string, context: RevyContext): Promise<string[]> => {
  // This would integrate with the knowledge base
  // For now, return empty array
  return [];
};
