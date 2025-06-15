
import { supabase } from '@/integrations/supabase/client';
import { RevyContext, RevyChatMessage } from '@/types/revio';
import { generateEmbeddingsForExistingArticles } from './generateEmbeddingsService';

// Enhanced AI response generation with automatic embedding generation
export const generateEnhancedAIResponse = async (
  message: string, 
  context: RevyContext,
  history: RevyChatMessage[],
  clientData?: any,
  userRole?: string,
  sessionId?: string
): Promise<string> => {
  console.log('🚀 Calling enhanced generateAIResponse service', {
    context,
    hasClientData: !!clientData,
    userRole,
    messageLength: message.length,
    historyLength: history.length,
  });

  // Check if user is asking about knowledge/ISA standards and if embeddings exist
  const isKnowledgeQuery = /\b(isa|revisjonsstandard|fagstoff|artikkel|retningslinje)\b/i.test(message);
  
  if (isKnowledgeQuery) {
    console.log('🔍 Knowledge query detected, checking if embeddings exist...');
    
    // Check if we have any articles with embeddings
    const { data: articlesWithEmbeddings, error } = await supabase
      .from('knowledge_articles')
      .select('id')
      .eq('status', 'published')
      .not('embedding', 'is', null)
      .limit(1);
    
    if (!error && (!articlesWithEmbeddings || articlesWithEmbeddings.length === 0)) {
      console.log('⚠️ No embeddings found, triggering generation...');
      
      // Generate embeddings in the background (don't wait for completion)
      generateEmbeddingsForExistingArticles()
        .then(result => {
          console.log('🎉 Background embedding generation completed:', result);
        })
        .catch(error => {
          console.error('❌ Background embedding generation failed:', error);
        });
    }
  }

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
      userId: user.id
    };

    console.log('📤 Sending request to revy-ai-chat edge function with enhanced knowledge lookup');

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

    console.log('✅ Enhanced AI response received successfully', { responseLength: data.response.length });
    return data.response;

  } catch (error) {
    console.error('💥 Final catch block in enhanced generateAIResponse:', error);
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred while contacting the AI assistant.');
  }
};
