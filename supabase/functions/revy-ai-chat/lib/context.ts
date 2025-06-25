
import { searchKnowledgeIntelligently } from './improved-knowledge.ts';
import { fetchEnhancedClientContext } from './client-context.ts';
import { log } from '../_shared/log.ts';

export async function buildEnhancedContext(message: string, context: string, clientData: any | null) {
  log('🏗️ Building enhanced context with improved search and article mappings...');
  try {
    // Use the improved knowledge search that returns both articles and tag mappings
    const knowledgePromise = searchKnowledgeIntelligently(message, context);
    
    const clientContextPromise = (clientData && clientData.id) 
      ? fetchEnhancedClientContext(clientData.id) 
      : Promise.resolve(null);
    
    const [knowledgeResult, clientContext] = await Promise.all([
      knowledgePromise,
      clientContextPromise
    ]);
    
    log('✅ Enhanced context built with improved search and article mappings.', { 
      hasKnowledge: !!knowledgeResult && knowledgeResult.articles.length > 0,
      knowledgeCount: knowledgeResult?.articles.length || 0,
      tagMappingCount: Object.keys(knowledgeResult?.tagToArticleMap || {}).length,
      hasClientContext: !!clientContext 
    });

    return { 
      knowledge: knowledgeResult?.articles || [], 
      articleTagMapping: knowledgeResult?.tagToArticleMap || {},
      clientContext 
    };
  } catch (err) {
    console.error("Error building enhanced context:", err);
    return { knowledge: null, clientContext: null, articleTagMapping: {} };
  }
}
