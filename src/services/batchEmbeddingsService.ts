import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface BatchEmbeddingRequest {
  entity_type: 'knowledge_articles' | 'legal_provisions' | 'legal_documents';
  batch_size?: number;
  specific_ids?: string[];
}

export interface BatchEmbeddingResponse {
  success: boolean;
  processed: number;
  errors: number;
  message: string;
  failed_ids?: string[];
}

export interface BatchProcessingStats {
  total_missing: number;
  total_processed: number;
  total_errors: number;
  batches_completed: number;
  estimated_time_remaining: number;
}

export const generateBatchEmbeddings = async (
  request: BatchEmbeddingRequest
): Promise<BatchEmbeddingResponse> => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    logger.info('Starting batch embedding generation', { request });

    const { data, error } = await supabase.functions.invoke('batch-generate-embeddings', {
      body: request
    });

    if (error) {
      logger.error('Supabase function error:', error);
      throw new Error(`Failed to invoke batch embeddings function: ${error.message}`);
    }

    logger.info('Batch embedding generation completed', { result: data });
    return data as BatchEmbeddingResponse;

  } catch (error) {
    logger.error('Error in generateBatchEmbeddings:', error);
    throw error;
  }
};

export const processAllMissingEmbeddings = async (
  entityType: 'knowledge_articles' | 'legal_provisions' | 'legal_documents',
  batchSize: number = 10,
  onProgress?: (stats: BatchProcessingStats) => void
): Promise<BatchProcessingStats> => {
  const stats: BatchProcessingStats = {
    total_missing: 0,
    total_processed: 0,
    total_errors: 0,
    batches_completed: 0,
    estimated_time_remaining: 0
  };

  try {
    // First, get the total count of missing embeddings
    let countResult;
    if (entityType === 'knowledge_articles') {
      countResult = await supabase
        .from('knowledge_articles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .is('embedding', null);
    } else if (entityType === 'legal_provisions') {
      countResult = await supabase
        .from('legal_provisions')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('embedding', null);
    } else if (entityType === 'legal_documents') {
      countResult = await supabase
        .from('legal_documents')
        .select('id', { count: 'exact', head: true })
        .is('embedding', null);
    }

    stats.total_missing = countResult?.count || 0;

    logger.info(`Found ${stats.total_missing} ${entityType} missing embeddings`);

    if (stats.total_missing === 0) {
      return stats;
    }

    const totalBatches = Math.ceil(stats.total_missing / batchSize);
    const startTime = Date.now();

    // Process in batches
    for (let batch = 0; batch < totalBatches; batch++) {
      try {
        const result = await generateBatchEmbeddings({
          entity_type: entityType,
          batch_size: batchSize
        });

        stats.total_processed += result.processed;
        stats.total_errors += result.errors;
        stats.batches_completed = batch + 1;

        // Calculate estimated time remaining
        const elapsed = Date.now() - startTime;
        const avgTimePerBatch = elapsed / (batch + 1);
        const remainingBatches = totalBatches - (batch + 1);
        stats.estimated_time_remaining = Math.round((avgTimePerBatch * remainingBatches) / 1000);

        logger.info(`Batch ${batch + 1}/${totalBatches} completed`, {
          processed: result.processed,
          errors: result.errors,
          estimated_time_remaining: stats.estimated_time_remaining
        });

        // Call progress callback if provided
        if (onProgress) {
          onProgress(stats);
        }

        // Break if no more items were processed
        if (result.processed === 0) {
          break;
        }

        // Delay between batches to avoid overwhelming the API
        if (batch < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        logger.error(`Error in batch ${batch + 1}:`, error);
        stats.total_errors++;
      }
    }

    logger.info('Batch processing completed', { stats });
    return stats;

  } catch (error) {
    logger.error('Error in processAllMissingEmbeddings:', error);
    throw error;
  }
};

export const getMissingEmbeddingsStats = async (): Promise<{
  knowledge_articles: number;
  legal_provisions: number;
  legal_documents: number;
}> => {
  try {
    const [articlesResult, provisionsResult, documentsResult] = await Promise.all([
      supabase
        .from('knowledge_articles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .is('embedding', null),
      
      supabase
        .from('legal_provisions')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('embedding', null),
      
      supabase
        .from('legal_documents')
        .select('id', { count: 'exact', head: true })
        .is('embedding', null)
    ]);

    return {
      knowledge_articles: articlesResult.count || 0,
      legal_provisions: provisionsResult.count || 0,
      legal_documents: documentsResult.count || 0
    };

  } catch (error) {
    logger.error('Error getting missing embeddings stats:', error);
    throw error;
  }
};