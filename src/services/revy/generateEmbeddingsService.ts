
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

export const generateEmbeddingsForExistingArticles = async (): Promise<{
  success: boolean;
  processed: number;
  errors: number;
  message: string;
}> => {
  if (!isSupabaseConfigured || !supabase) {
    console.error("Supabase is not configured. Cannot generate embeddings.");
    return { success: false, processed: 0, errors: 1, message: "Supabase not initialized" };
  }
  try {
    console.log('🚀 Starting embedding generation for existing articles...');
    
    // Send empty JSON object instead of no body
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: {}
    });
    
    if (error) {
      console.error('❌ Error calling generate-embeddings function:', error);
      throw new Error(error.message || 'Failed to generate embeddings');
    }
    
    console.log('✅ Embedding generation response:', data);
    
    return {
      success: true,
      processed: data.processed || 0,
      errors: data.errors || 0,
      message: data.message || 'Embeddings generated successfully'
    };
    
  } catch (error) {
    console.error('💥 Error in generateEmbeddingsForExistingArticles:', error);
    return {
      success: false,
      processed: 0,
      errors: 1,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
