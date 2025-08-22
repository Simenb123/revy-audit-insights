import { logger } from '@/utils/logger';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { createTimeoutSignal } from '@/utils/networkHelpers';

export const generateLegalEmbeddingsForExistingContent = async (): Promise<{
  success: boolean;
  processed: number;
  errors: number;
  message: string;
}> => {
  if (!isSupabaseConfigured || !supabase) {
    logger.error("Supabase is not configured. Cannot generate legal embeddings.");
    return { success: false, processed: 0, errors: 1, message: "Supabase not initialized" };
  }

  try {
    logger.log('🚀 Starting legal embeddings generation for existing content...');
    
    const { signal, clear } = createTimeoutSignal(60000); // 60 second timeout

    const { data, error } = await supabase.functions.invoke('generate-legal-embeddings', {
      body: { batch_size: 20 },
      signal
    } as any);

    clear();
    
    if (error) {
      logger.error('❌ Error calling generate-legal-embeddings function:', error);
      throw new Error(error.message || 'Failed to generate legal embeddings');
    }
    
    logger.log('✅ Legal embeddings generation response:', data);
    
    return {
      success: true,
      processed: data.processed || 0,
      errors: data.errors || 0,
      message: data.message || 'Legal embeddings generated successfully'
    };
    
  } catch (error: any) {
    logger.error('💥 Error in generateLegalEmbeddingsForExistingContent:', error);
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

export const generateEmbeddingForSingleDocument = async (documentId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  if (!isSupabaseConfigured || !supabase) {
    logger.error("Supabase is not configured. Cannot generate embedding.");
    return { success: false, message: "Supabase not initialized" };
  }

  try {
    logger.log(`🔍 Generating embedding for document: ${documentId}`);
    
    const { signal, clear } = createTimeoutSignal(30000);

    const { data, error } = await supabase.functions.invoke('generate-legal-embeddings', {
      body: { document_id: documentId },
      signal
    } as any);

    clear();
    
    if (error) {
      logger.error('❌ Error generating embedding for document:', error);
      throw new Error(error.message || 'Failed to generate embedding');
    }
    
    return {
      success: data.success || false,
      message: data.message || 'Embedding generated successfully'
    };
    
  } catch (error: any) {
    logger.error('💥 Error in generateEmbeddingForSingleDocument:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const generateEmbeddingForSingleProvision = async (provisionId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  if (!isSupabaseConfigured || !supabase) {
    logger.error("Supabase is not configured. Cannot generate embedding.");
    return { success: false, message: "Supabase not initialized" };
  }

  try {
    logger.log(`🔍 Generating embedding for provision: ${provisionId}`);
    
    const { signal, clear } = createTimeoutSignal(30000);

    const { data, error } = await supabase.functions.invoke('generate-legal-embeddings', {
      body: { provision_id: provisionId },
      signal
    } as any);

    clear();
    
    if (error) {
      logger.error('❌ Error generating embedding for provision:', error);
      throw new Error(error.message || 'Failed to generate embedding');
    }
    
    return {
      success: data.success || false,
      message: data.message || 'Embedding generated successfully'
    };
    
  } catch (error: any) {
    logger.error('💥 Error in generateEmbeddingForSingleProvision:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};