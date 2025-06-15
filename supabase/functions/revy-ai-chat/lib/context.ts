
import { searchRelevantKnowledge } from './knowledge.ts';
import { fetchEnhancedClientContext } from './client-context.ts';

export async function buildEnhancedContext(message: string, context: string, clientData: any | null) {
  console.log('🏗️ Building enhanced context...');
  try {
    const knowledgePromise = searchRelevantKnowledge(message, context);
    
    const clientContextPromise = (clientData && clientData.id) 
      ? fetchEnhancedClientContext(clientData.id) 
      : Promise.resolve(null);
    
    const [knowledge, clientContext] = await Promise.all([
      knowledgePromise,
      clientContextPromise
    ]);
    
    console.log('✅ Enhanced context built.', { 
      hasKnowledge: !!knowledge && knowledge.length > 0,
      hasClientContext: !!clientContext 
    });

    return { knowledge, clientContext };
  } catch (err) {
    console.error("Error building enhanced context:", err);
    // Return a default object so the main flow doesn't crash
    return { knowledge: null, clientContext: null };
  }
}
