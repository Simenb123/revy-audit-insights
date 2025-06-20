
import { buildVariantSpecificPrompt, getVariantContextualTips } from './variant-handler.ts';
import { searchKnowledgeIntelligently } from './improved-knowledge.ts';
import { fetchEnhancedClientContext } from './client-context.ts';

export async function buildEnhancedContextWithVariant(
  message: string, 
  context: string, 
  clientData: any | null,
  selectedVariant: any | null
) {
  console.log('🏗️ Building enhanced context with variant support:', {
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
    
    const [knowledgeResult, enhancedClientContext] = await Promise.all([
      knowledgePromise,
      clientContextPromise
    ]);

    // Enhance client data with documents if available
    const enrichedClientData = clientData ? {
      ...clientData,
      documentContext: enhancedClientContext,
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
    
    console.log('✅ Enhanced context built with variant support:', { 
      hasKnowledge: !!knowledgeResult && knowledgeResult.articles.length > 0,
      knowledgeCount: knowledgeResult?.articles.length || 0,
      tagMappingCount: Object.keys(knowledgeResult?.tagToArticleMap || {}).length,
      hasClientContext: !!enhancedClientContext,
      variantName: selectedVariant?.name
    });

    return { 
      knowledge: knowledgeResult?.articles || [], 
      articleTagMapping: knowledgeResult?.tagToArticleMap || {},
      clientContext: enhancedClientContext,
      enrichedClientData,
      variant: selectedVariant
    };
  } catch (err) {
    console.error("Error building enhanced context with variant:", err);
    return { 
      knowledge: null, 
      clientContext: null, 
      articleTagMapping: {},
      enrichedClientData: clientData,
      variant: selectedVariant
    };
  }
}
