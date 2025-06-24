
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { searchClientDocuments, DocumentSearchResult } from './document-search.ts';

export interface EnhancedContext {
  knowledge: any;
  articleTagMapping: Record<string, string[]>;
  clientContext: any;
  documentSearchResults: DocumentSearchResult | null;
}

export const buildEnhancedContextWithVariant = async (
  message: string,
  context: string,
  clientData: any,
  variant: any
) => {
  console.log('🏗️ Building enhanced context with variant and document search support:', { 
    context, 
    variantName: variant?.name, 
    hasClientData: !!clientData 
  });

  // Initialize Supabase for document search
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const enhancedContext: any = {
    knowledge: null,
    articleTagMapping: {},
    clientContext: null,
    documentSearchResults: null
  };

  try {
    // 1. Get knowledge articles via knowledge-search function
    console.log('🔍 Starting knowledge search...');
    
    const knowledgeResponse = await supabase.functions.invoke('knowledge-search', {
      body: { query: message }
    });

    if (knowledgeResponse.error) {
      console.error('❌ Knowledge search failed:', knowledgeResponse.error);
    } else if (knowledgeResponse.data) {
      console.log('📚 Knowledge search response received:', {
        hasArticles: !!knowledgeResponse.data.articles,
        articlesCount: knowledgeResponse.data.articles?.length || 0,
        hasTagMapping: !!knowledgeResponse.data.tagMapping
      });

      if (knowledgeResponse.data.articles && Array.isArray(knowledgeResponse.data.articles)) {
        enhancedContext.knowledge = knowledgeResponse.data.articles;
        enhancedContext.articleTagMapping = knowledgeResponse.data.tagMapping || {};
        console.log('✅ Knowledge articles loaded successfully:', {
          articlesCount: knowledgeResponse.data.articles.length,
          tagMappingCount: Object.keys(knowledgeResponse.data.tagMapping || {}).length
        });
      } else {
        console.log('⚠️ No articles found in knowledge search response');
      }
    }

    // 2. Search client documents if available
    if (clientData?.id) {
      console.log('📄 Searching client documents for relevant content...');
      
      try {
        const documentResults = await searchClientDocuments(message, clientData, supabase);
        
        if (documentResults) {
          enhancedContext.documentSearchResults = documentResults;
          console.log('📄 Document search results:', {
            hasSpecificDocument: !!documentResults.specificDocument,
            generalDocumentsCount: documentResults.generalDocuments?.length || 0
          });
        }
      } catch (docError) {
        console.error('❌ Document search error:', docError);
        // Continue without document results
      }
    }

    // 3. Build client context
    if (clientData) {
      enhancedContext.clientContext = {
        company_name: clientData.company_name || clientData.name,
        org_number: clientData.org_number,
        industry: clientData.industry,
        phase: clientData.phase,
        documents: clientData.documents || [],
        documentSummary: clientData.documentSummary || {}
      };
    }

    console.log('🧠 Enhanced variant-aware context built with document support:', {
      knowledgeArticleCount: enhancedContext.knowledge?.length || 0,
      articleTagMappingCount: Object.keys(enhancedContext.articleTagMapping || {}).length,
      hasClientContext: !!enhancedContext.clientContext,
      hasDocumentResults: !!enhancedContext.documentSearchResults,
      specificDocumentFound: !!enhancedContext.documentSearchResults?.specificDocument,
      generalDocumentsFound: enhancedContext.documentSearchResults?.generalDocuments?.length || 0,
      isGuestMode: !Deno.env.get('SUPABASE_USER_ID'),
      variantName: variant?.name,
      variantDescription: variant?.description
    });

    return enhancedContext;

  } catch (error) {
    console.error('❌ Error building enhanced context:', error);
    // Return partial context instead of failing completely
    return enhancedContext;
  }
};
