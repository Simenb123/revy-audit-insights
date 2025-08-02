import { logger } from '@/utils/logger';

import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { createTimeoutSignal } from '@/utils/networkHelpers';

export const generateEmbeddingsForExistingArticles = async (): Promise<{
  success: boolean;
  processed: number;
  errors: number;
  message: string;
}> => {
  if (!isSupabaseConfigured || !supabase) {
    logger.error("Supabase is not configured. Cannot generate embeddings.");
    return { success: false, processed: 0, errors: 1, message: "Supabase not initialized" };
  }
  try {
    logger.log('🚀 Starting embedding generation for existing articles...');
    
    // Send empty JSON object instead of no body
    const { signal, clear } = createTimeoutSignal(30000); // Increased timeout

    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: {},
      signal
    } as any);

    clear();
    
    if (error) {
      logger.error('❌ Error calling generate-embeddings function:', error);
      throw new Error(error.message || 'Failed to generate embeddings');
    }
    
    logger.log('✅ Embedding generation response:', data);
    
    return {
      success: true,
      processed: data.processed || 0,
      errors: data.errors || 0,
      message: data.message || 'Embeddings generated successfully'
    };
    
  } catch (error: any) {
    logger.error('💥 Error in generateEmbeddingsForExistingArticles:', error);
    if (error.name === 'AbortError') {
      return {
        success: false,
        processed: 0,
        errors: 1,
        message: 'Tilkoblingen tok for lang tid, prøv igjen senere'
      };
    }
    return {
      success: false,
      processed: 0,
      errors: 1,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Force generation of embeddings for articles missing them
export const generateMissingEmbeddings = async (): Promise<{
  success: boolean;
  processed: number;
  errors: number;
  message: string;
}> => {
  if (!isSupabaseConfigured || !supabase) {
    logger.error("Supabase is not configured. Cannot generate missing embeddings.");
    return { success: false, processed: 0, errors: 1, message: "Supabase not initialized" };
  }
  
  try {
    logger.log('🔍 Identifying articles missing embeddings...');
    
    // Get articles without embeddings
    const { data: articlesWithoutEmbeddings, error: fetchError } = await supabase
      .from('knowledge_articles')
      .select('id, title')
      .eq('status', 'published')
      .is('embedding', null);
    
    if (fetchError) {
      logger.error('❌ Error fetching articles without embeddings:', fetchError);
      throw new Error(fetchError.message);
    }
    
    if (!articlesWithoutEmbeddings || articlesWithoutEmbeddings.length === 0) {
      logger.log('✅ All published articles already have embeddings');
      return {
        success: true,
        processed: 0,
        errors: 0,
        message: 'All published articles already have embeddings'
      };
    }
    
    logger.log(`📝 Found ${articlesWithoutEmbeddings.length} articles missing embeddings:`, 
      articlesWithoutEmbeddings.map(a => a.title));
    
    let processed = 0;
    let errors = 0;
    
    // Process each article individually with delay
    for (const article of articlesWithoutEmbeddings) {
      try {
        const { signal, clear } = createTimeoutSignal(15000);
        
        const { data, error } = await supabase.functions.invoke('generate-embeddings', {
          body: { article_id: article.id },
          signal
        } as any);
        
        clear();
        
        if (error) {
          logger.error(`❌ Error generating embedding for "${article.title}":`, error);
          errors++;
        } else {
          logger.log(`✅ Generated embedding for "${article.title}"`);
          processed++;
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        logger.error(`💥 Error processing "${article.title}":`, error);
        errors++;
      }
    }
    
    return {
      success: processed > 0,
      processed,
      errors,
      message: `Processed ${processed} articles with ${errors} errors`
    };
    
  } catch (error: any) {
    logger.error('💥 Error in generateMissingEmbeddings:', error);
    return {
      success: false,
      processed: 0,
      errors: 1,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
