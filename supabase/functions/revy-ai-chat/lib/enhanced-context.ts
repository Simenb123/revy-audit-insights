
import { buildVariantSpecificPrompt, getVariantContextualTips } from './variant-handler.ts';
import { searchKnowledgeIntelligently } from './improved-knowledge.ts';
import { fetchEnhancedClientContext, findDocumentByReference, searchDocumentContent } from './client-context.ts';

export async function buildEnhancedContextWithVariant(
  message: string, 
  context: string, 
  clientData: any | null,
  selectedVariant: any | null
) {
  console.log('🏗️ Building enhanced context with variant and document search support:', {
    context,
    variantName: selectedVariant?.name,
    hasClientData: !!clientData
  });

  try {
    // Build base context
    const knowledgePromise = searchKnowledgeIntelligently(message, context);
    const clientContextPromise = (clientData && clientData.id) 
      ? fetchEnhancedClientContext(clientData.id) 
      : Promise.resolve(null);
    
    // Check if this is a document query and search for specific documents
    let documentSearchResults = null;
    if (clientData?.id && isDocumentQuery(message)) {
      console.log('📄 Document query detected, searching for specific documents...');
      
      try {
        // Try to find specific document by reference first
        const specificDoc = await findDocumentByReference(clientData.id, message);
        
        if (specificDoc && specificDoc.fullContent) {
          documentSearchResults = {
            specificDocument: specificDoc,
            searchResults: []
          };
          console.log('✅ Found specific document:', specificDoc.fileName);
        } else {
          // Fall back to general document search
          const searchResults = await searchDocumentContent(clientData.id, message);
          documentSearchResults = {
            specificDocument: null,
            searchResults: searchResults || []
          };
          console.log(`✅ Found ${searchResults?.length || 0} relevant documents`);
        }
      } catch (docError) {
        console.error('❌ Error searching documents:', docError);
        documentSearchResults = { specificDocument: null, searchResults: [] };
      }
    }
    
    const [knowledgeResult, enhancedClientContext] = await Promise.all([
      knowledgePromise,
      clientContextPromise
    ]);

    // Enhance client data with documents if available
    const enrichedClientData = clientData ? {
      ...clientData,
      documentContext: enhancedClientContext,
      documentSearchResults,
      // Add document summary for variant-specific use
      documentSummary: {
        totalDocuments: clientData.documents?.length || 0,
        categories: [...new Set((clientData.documents || []).map((d: any) => d.category).filter(Boolean))],
        recentDocuments: (clientData.documents || []).slice(0, 3).map((d: any) => ({
          name: d.file_name,
          category: d.category,
          uploadDate: d.created_at
        }))
      }
    } : null;
    
    console.log('✅ Enhanced context built with variant and document search support:', { 
      hasKnowledge: !!knowledgeResult && knowledgeResult.articles.length > 0,
      knowledgeCount: knowledgeResult?.articles.length || 0,
      tagMappingCount: Object.keys(knowledgeResult?.tagToArticleMap || {}).length,
      hasClientContext: !!enhancedClientContext,
      variantName: selectedVariant?.name,
      hasDocumentSearchResults: !!documentSearchResults,
      specificDocumentFound: !!documentSearchResults?.specificDocument,
      generalDocumentsFound: documentSearchResults?.searchResults?.length || 0
    });

    return { 
      knowledge: knowledgeResult?.articles || [], 
      articleTagMapping: knowledgeResult?.tagToArticleMap || {},
      clientContext: enhancedClientContext,
      enrichedClientData,
      variant: selectedVariant,
      documentSearchResults
    };
  } catch (err) {
    console.error("Error building enhanced context with variant and document search:", err);
    return { 
      knowledge: null, 
      clientContext: null, 
      articleTagMapping: {},
      enrichedClientData: clientData,
      variant: selectedVariant,
      documentSearchResults: null
    };
  }
}

// Check if the user message is asking about documents
function isDocumentQuery(message: string): boolean {
  const documentKeywords = [
    'dokument', 'faktura', 'rapport', 'fil', 'innhold', 'står på', 'viser',
    'hva inneholder', 'kan du lese', 'se på', 'analyser', 'gjennomgå',
    'nummer', 'kvitering', 'bilag', 'regning'
  ];
  
  const messageLower = message.toLowerCase();
  return documentKeywords.some(keyword => messageLower.includes(keyword));
}
