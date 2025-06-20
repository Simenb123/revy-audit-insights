
import { searchKnowledgeIntelligently } from './improved-knowledge.ts';
import { fetchEnhancedClientContext, searchDocumentContent, findDocumentByReference } from './client-context.ts';

export async function buildEnhancedContextWithVariant(
  message: string, 
  context: string, 
  clientData: any | null, 
  selectedVariant?: any
) {
  console.log('🏗️ Building enhanced context with variant and document search support:', {
    context,
    variantName: selectedVariant?.name,
    hasClientData: !!clientData
  });
  
  try {
    // Use the improved knowledge search that returns both articles and tag mappings
    const knowledgePromise = searchKnowledgeIntelligently(message, context);
    
    const clientContextPromise = (clientData && clientData.id) 
      ? fetchEnhancedClientContext(clientData.id) 
      : Promise.resolve(null);

    // Check if this is a document-related query and search for relevant documents
    let documentSearchResults = null;
    if (clientData && clientData.id && isDocumentQuery(message)) {
      console.log('📄 Document query detected, searching for specific documents...');
      
      try {
        // Try to find specific document by reference first
        const specificDoc = await findDocumentByReference(clientData.id, message);
        
        if (specificDoc && specificDoc.fullContent) {
          documentSearchResults = {
            specificDocument: specificDoc,
            generalDocuments: []
          };
          console.log('✅ Found specific document with content:', specificDoc.fileName);
        } else {
          // Fall back to general document search
          const generalDocs = await searchDocumentContent(clientData.id, message);
          documentSearchResults = {
            specificDocument: null,
            generalDocuments: generalDocs || []
          };
          console.log(`✅ Found ${generalDocs?.length || 0} relevant documents`);
        }
      } catch (docError) {
        console.error('❌ Error searching for documents:', docError);
      }
    }
    
    const [knowledgeResult, clientContext] = await Promise.all([
      knowledgePromise,
      clientContextPromise
    ]);
    
    console.log('✅ Enhanced context built with variant and document search support:', { 
      hasKnowledge: !!knowledgeResult && knowledgeResult.articles.length > 0,
      knowledgeCount: knowledgeResult?.articles.length || 0,
      tagMappingCount: Object.keys(knowledgeResult?.tagToArticleMap || {}).length,
      hasClientContext: !!clientContext,
      variantName: selectedVariant?.name,
      hasDocumentSearchResults: !!documentSearchResults,
      specificDocumentFound: !!documentSearchResults?.specificDocument,
      generalDocumentsFound: documentSearchResults?.generalDocuments?.length || 0
    });

    return { 
      knowledge: knowledgeResult?.articles || [], 
      articleTagMapping: knowledgeResult?.tagToArticleMap || {},
      clientContext,
      documentSearchResults
    };
  } catch (err) {
    console.error("Error building enhanced context:", err);
    return { 
      knowledge: null, 
      clientContext: null, 
      articleTagMapping: {},
      documentSearchResults: null
    };
  }
}

// Helper function to detect document queries
function isDocumentQuery(message: string): boolean {
  const documentKeywords = [
    'dokument', 'faktura', 'rapport', 'fil', 'innhold', 'står på', 'viser',
    'hva inneholder', 'kan du lese', 'se på', 'analyser', 'gjennomgå',
    'nummer', 'kvitering', 'bilag', 'regning', 'hva står på'
  ];
  
  const messageLower = message.toLowerCase();
  return documentKeywords.some(keyword => messageLower.includes(keyword));
}
