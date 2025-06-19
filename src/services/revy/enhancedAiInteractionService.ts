
import { supabase } from '@/integrations/supabase/client';
import { RevyContext } from '@/types/revio';
import { generateEmbeddingsForExistingArticles } from './generateEmbeddingsService';

// Enhanced AI response generation with document context
export const generateEnhancedAIResponse = async (
  message: string, 
  context: RevyContext,
  history: Array<{ sender: string; content: string }>,
  clientData?: any,
  userRole?: string,
  sessionId?: string
): Promise<string> => {
  console.log('🚀 Calling enhanced generateAIResponse service with document context', {
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

  // Enhance clientData with document context if available
  let enhancedClientData = clientData;
  
  if (clientData?.id) {
    try {
      console.log('📄 Fetching document context for client:', clientData.id);
      
      // Get client documents with AI analysis
      const { data: documents, error: docsError } = await supabase
        .from('client_documents_files')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false });

      if (!docsError && documents) {
        // Get document relationships
        const documentIds = documents.map(d => d.id);
        const { data: relationships, error: relError } = await supabase
          .from('document_relationships')
          .select('*')
          .or(`parent_document_id.in.(${documentIds.join(',')}),child_document_id.in.(${documentIds.join(',')})`);

        // Calculate document statistics
        const documentStats = {
          total: documents.length,
          highConfidence: documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.8).length,
          mediumConfidence: documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.6 && d.ai_confidence_score < 0.8).length,
          lowConfidence: documents.filter(d => d.ai_confidence_score && d.ai_confidence_score < 0.6).length,
          uncategorized: documents.filter(d => !d.ai_confidence_score).length,
          categories: [...new Set(documents.map(d => d.category).filter(Boolean))],
          relationships: relationships?.length || 0
        };

        // Identify recent documents
        const recentDocuments = documents.slice(0, 5).map(d => ({
          name: d.file_name,
          category: d.category,
          confidence: d.ai_confidence_score,
          analysis: d.ai_analysis_summary,
          uploadDate: d.created_at
        }));

        enhancedClientData = {
          ...clientData,
          documentContext: {
            stats: documentStats,
            recentDocuments,
            hasDocumentRelationships: (relationships?.length || 0) > 0,
            documentQualityScore: documentStats.total > 0 ? 
              (documentStats.highConfidence / documentStats.total * 100) : 0
          }
        };

        console.log('📊 Enhanced client data with document context:', {
          totalDocs: documentStats.total,
          qualityScore: enhancedClientData.documentContext.documentQualityScore,
          relationships: documentStats.relationships
        });
      }
    } catch (error) {
      console.error('❌ Error fetching document context:', error);
      // Continue without document context if there's an error
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

    const requestBody = {
      message,
      context,
      history,
      clientData: enhancedClientData,
      userRole,
      sessionId,
      userId: user.id
    };

    console.log('📤 Sending request to revy-ai-chat edge function with enhanced document context');

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
