
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { searchClientDocuments, DocumentSearchResult } from './document-search.ts';
import { log } from '../_shared/log.ts';
import { getScopedClient } from './supabase.ts';

export interface EnhancedContext {
  knowledge: any;
  articleTagMapping: Record<string, string[]>;
  clientContext: any;
  documentSearchResults: DocumentSearchResult | null;
}

export const buildEnhancedContextWithVariant = async (
  req: Request,
  message: string,
  context: string,
  clientData: any,
  variant: any
) => {
  log('🏗️ Building enhanced context with variant and document search support:', { 
    context, 
    variantName: variant?.name, 
    hasClientData: !!clientData 
  });

  const supabase = getScopedClient(req);

  const enhancedContext: any = {
    knowledge: null,
    articleTagMapping: {},
    clientContext: null,
    documentSearchResults: null
  };

  try {
    // 1. Get knowledge articles via knowledge-search function with proper JSON body
    log('🔍 Starting knowledge search with proper JSON body...');
    
    // Ensure we send proper JSON body to knowledge-search
    const queryParts = [message, context, clientData?.industry]
      .filter(Boolean)
      .join(' ')
      .trim();
    const knowledgeRequestBody = {
      query: queryParts || 'revisjon', // fallback query if everything empty
    };

    log('📤 Sending knowledge search request with context:', knowledgeRequestBody);

    const knowledgeResponse = await supabase.functions.invoke('knowledge-search', {
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.get('Authorization') && { 'Authorization': req.headers.get('Authorization')! })
      },
      body: knowledgeRequestBody
    });

    if (knowledgeResponse.error) {
      console.error('❌ Knowledge search failed:', knowledgeResponse.error);
      // Continue with empty knowledge instead of failing
      log('⚠️ Continuing without knowledge base results');
    } else if (knowledgeResponse.data) {
      log('📚 Knowledge search response received:', {
        hasArticles: !!knowledgeResponse.data.articles,
        articlesCount: knowledgeResponse.data.articles?.length || 0,
        hasTagMapping: !!knowledgeResponse.data.tagMapping
      });

      if (knowledgeResponse.data.articles && Array.isArray(knowledgeResponse.data.articles)) {
        enhancedContext.knowledge = knowledgeResponse.data.articles;
        enhancedContext.articleTagMapping = knowledgeResponse.data.tagMapping || {};
        log('✅ Knowledge articles loaded successfully:', {
          articlesCount: knowledgeResponse.data.articles.length,
          tagMappingCount: Object.keys(knowledgeResponse.data.tagMapping || {}).length
        });
      } else {
        log('⚠️ No articles found in knowledge search response');
      }
    }

    // 2. Search client documents if available
    if (clientData?.id) {
      log('📄 Searching client documents for relevant content...');
      
      try {
        const documentResults = await searchClientDocuments(message, clientData, supabase);
        
        if (documentResults) {
          enhancedContext.documentSearchResults = documentResults;
          log('📄 Document search results:', {
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

    log('🧠 Enhanced variant-aware context successfully built:', {
      knowledgeArticleCount: enhancedContext.knowledge?.length || 0,
      articleTagMappingCount: Object.keys(enhancedContext.articleTagMapping || {}).length,
      hasClientContext: !!enhancedContext.clientContext,
      hasDocumentResults: !!enhancedContext.documentSearchResults,
      specificDocumentFound: !!enhancedContext.documentSearchResults?.specificDocument,
      generalDocumentsFound: enhancedContext.documentSearchResults?.generalDocuments?.length || 0,
      variantName: variant?.name,
      variantDescription: variant?.description
    });

    return enhancedContext;

  } catch (error) {
    console.error('❌ Error building enhanced context:', error);
    // Return partial context instead of failing completely
    log('⚠️ Returning partial context due to error');
    return enhancedContext;
  }
};
