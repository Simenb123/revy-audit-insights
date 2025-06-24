
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
    // 1. Get knowledge articles (fixed parameter name)
    console.log('🔍 Starting intelligent knowledge search with enhanced content type support...');
    
    const knowledgeResponse = await fetch(`${supabaseUrl}/functions/v1/knowledge-search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: message, // Fixed: was 'message', now 'query'
        context,
        limit: 15
      })
    });

    if (knowledgeResponse.ok) {
      const knowledgeData = await knowledgeResponse.json();
      console.log('📚 Knowledge search response:', {
        hasArticles: !!knowledgeData.articles,
        articlesCount: knowledgeData.articles?.length || 0,
        hasTagMapping: !!knowledgeData.tagMapping
      });

      if (knowledgeData.articles && Array.isArray(knowledgeData.articles)) {
        enhancedContext.knowledge = knowledgeData.articles;
        enhancedContext.articleTagMapping = knowledgeData.tagMapping || {};
        console.log('✅ Knowledge articles loaded successfully:', {
          articlesCount: knowledgeData.articles.length,
          tagMappingCount: Object.keys(knowledgeData.tagMapping || {}).length
        });
      } else {
        console.log('⚠️ No articles found in knowledge search response');
      }
    } else {
      const errorText = await knowledgeResponse.text();
      console.error('❌ Knowledge search failed:', {
        status: knowledgeResponse.status,
        statusText: knowledgeResponse.statusText,
        error: errorText
      });
      // Continue without knowledge - don't fail the entire request
    }

    // 2. Search client documents if available
    if (clientData?.id) {
      console.log('📄 Searching client documents for relevant content...');
      
      try {
        // Import and use document search
        const { searchClientDocuments } = await import('./document-search.ts');
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
