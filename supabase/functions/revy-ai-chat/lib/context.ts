
import { searchKnowledgeIntelligently } from './improved-knowledge.ts';
import { fetchEnhancedClientContext } from './client-context.ts';

export async function buildEnhancedContext(message: string, context: string, clientData: any | null) {
  console.log('🏗️ Building enhanced context with improved search...');
  try {
    // Use the improved knowledge search
    const knowledgePromise = searchKnowledgeIntelligently(message, context);
    
    const clientContextPromise = (clientData && clientData.id) 
      ? fetchEnhancedClientContext(clientData.id) 
      : Promise.resolve(null);
    
    const [knowledge, clientContext] = await Promise.all([
      knowledgePromise,
      clientContextPromise
    ]);
    
    console.log('✅ Enhanced context built with improved search.', { 
      hasKnowledge: !!knowledge && knowledge.length > 0,
      knowledgeCount: knowledge?.length || 0,
      hasClientContext: !!clientContext 
    });

    return { knowledge, clientContext };
  } catch (err) {
    console.error("Error building enhanced context:", err);
    return { knowledge: null, clientContext: null };
  }
}
