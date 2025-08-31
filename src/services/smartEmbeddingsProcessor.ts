import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

export interface EmbeddingProcessingStatus {
  total: number;
  processed: number;
  failed: number;
  inProgress: boolean;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining: number;
}

export interface BatchProcessingOptions {
  batchSize: number;
  delayBetweenBatches: number; // milliseconds
  maxRetries: number;
  prioritizeByImportance: boolean;
}

const DEFAULT_OPTIONS: BatchProcessingOptions = {
  batchSize: 10,
  delayBetweenBatches: 2000, // 2 seconds to avoid rate limits
  maxRetries: 3,
  prioritizeByImportance: true
};

export class SmartEmbeddingsProcessor {
  private status: EmbeddingProcessingStatus = {
    total: 0,
    processed: 0,
    failed: 0,
    inProgress: false,
    currentBatch: 0,
    totalBatches: 0,
    estimatedTimeRemaining: 0
  };

  private statusCallbacks: Array<(status: EmbeddingProcessingStatus) => void> = [];

  onStatusUpdate(callback: (status: EmbeddingProcessingStatus) => void) {
    this.statusCallbacks.push(callback);
  }

  private updateStatus(updates: Partial<EmbeddingProcessingStatus>) {
    this.status = { ...this.status, ...updates };
    this.statusCallbacks.forEach(callback => callback(this.status));
  }

  async processAllMissingEmbeddings(options: Partial<BatchProcessingOptions> = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      logger.log('Starting smart embeddings processing', opts);
      this.updateStatus({ inProgress: true, processed: 0, failed: 0 });

      // Get all items missing embeddings with prioritization
      const missingItems = await this.getMissingEmbeddingsWithPriority();
      
      if (missingItems.length === 0) {
        logger.log('No missing embeddings found');
        this.updateStatus({ inProgress: false });
        return { success: true, message: 'Ingen manglende embeddings funnet' };
      }

      const totalBatches = Math.ceil(missingItems.length / opts.batchSize);
      this.updateStatus({ 
        total: missingItems.length, 
        totalBatches,
        estimatedTimeRemaining: totalBatches * (opts.delayBetweenBatches + 5000) // Rough estimate
      });

      logger.log(`Processing ${missingItems.length} items in ${totalBatches} batches`);

      // Process in batches
      for (let i = 0; i < missingItems.length; i += opts.batchSize) {
        const batch = missingItems.slice(i, i + opts.batchSize);
        const batchNumber = Math.floor(i / opts.batchSize) + 1;
        
        this.updateStatus({ 
          currentBatch: batchNumber,
          estimatedTimeRemaining: (totalBatches - batchNumber) * (opts.delayBetweenBatches + 5000)
        });

        logger.log(`Processing batch ${batchNumber}/${totalBatches}`, { batchSize: batch.length });

        try {
          await this.processBatch(batch, opts.maxRetries);
        } catch (error) {
          logger.error(`Batch ${batchNumber} failed:`, error);
          this.updateStatus({ failed: this.status.failed + batch.length });
        }

        // Delay between batches to avoid rate limits
        if (i + opts.batchSize < missingItems.length) {
          await this.delay(opts.delayBetweenBatches);
        }
      }

      this.updateStatus({ inProgress: false, estimatedTimeRemaining: 0 });
      
      logger.log('Smart embeddings processing completed', {
        total: this.status.total,
        processed: this.status.processed,
        failed: this.status.failed
      });

      return {
        success: true,
        message: `Behandlet ${this.status.processed} av ${this.status.total} embeddings. ${this.status.failed} feilet.`,
        stats: {
          processed: this.status.processed,
          failed: this.status.failed,
          total: this.status.total
        }
      };

    } catch (error) {
      logger.error('Smart embeddings processing failed:', error);
      this.updateStatus({ inProgress: false });
      throw error;
    }
  }

  private async getMissingEmbeddingsWithPriority() {
    const missingItems: Array<{
      id: string;
      type: 'knowledge_article' | 'legal_provision' | 'legal_document';
      title: string;
      content: string;
      priority: number;
    }> = [];

    // Get knowledge articles missing embeddings (high priority)
    const { data: articles } = await supabase
      .from('knowledge_articles')
      .select('id, title, content')
      .eq('status', 'published')
      .is('embedding', null);

    if (articles) {
      missingItems.push(...articles.map(article => ({
        id: article.id,
        type: 'knowledge_article' as const,
        title: article.title,
        content: article.content || '',
        priority: 1 // Highest priority
      })));
    }

    // Get legal documents missing embeddings (medium priority)
    const { data: documents } = await supabase
      .from('legal_documents')
      .select('id, title, content')
      .eq('is_active', true)
      .is('embedding', null);

    if (documents) {
      missingItems.push(...documents.map(doc => ({
        id: doc.id,
        type: 'legal_document' as const,
        title: doc.title,
        content: doc.content || '',
        priority: 2
      })));
    }

    // Get legal provisions missing embeddings (medium-low priority, but lots of them)
    const { data: provisions } = await supabase
      .from('legal_provisions')
      .select('id, title, content, law_identifier, provision_number')
      .eq('is_active', true)
      .is('embedding', null)
      .limit(500); // Process in chunks to avoid memory issues

    if (provisions) {
      missingItems.push(...provisions.map(provision => ({
        id: provision.id,
        type: 'legal_provision' as const,
        title: `${provision.law_identifier} ${provision.provision_number}: ${provision.title}`,
        content: provision.content || '',
        priority: provision.law_identifier?.toLowerCase().includes('isa') ? 2 : 3
      })));
    }

    // Sort by priority, then by content length (longer content gets lower priority within same priority level)
    return missingItems.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.content.length - b.content.length; // Shorter content first within same priority
    });
  }

  private async processBatch(items: Array<{
    id: string;
    type: 'knowledge_article' | 'legal_provision' | 'legal_document';
    title: string;
    content: string;
  }>, maxRetries: number) {
    
    const batchPromises = items.map(async (item) => {
      let attempts = 0;
      while (attempts < maxRetries) {
        try {
          await this.processItem(item);
          this.updateStatus({ processed: this.status.processed + 1 });
          return;
        } catch (error) {
          attempts++;
          logger.warn(`Item ${item.id} failed attempt ${attempts}:`, error);
          
          if (attempts >= maxRetries) {
            logger.error(`Item ${item.id} failed after ${maxRetries} attempts:`, error);
            this.updateStatus({ failed: this.status.failed + 1 });
            throw error;
          }
          
          // Exponential backoff
          await this.delay(1000 * Math.pow(2, attempts));
        }
      }
    });

    // Process all items in the batch concurrently
    await Promise.allSettled(batchPromises);
  }

  private async processItem(item: {
    id: string;
    type: 'knowledge_article' | 'legal_provision' | 'legal_document';
    title: string;
    content: string;
  }) {
    
    const textToEmbed = `${item.title}\n\n${item.content}`.trim();
    
    if (!textToEmbed || textToEmbed.length < 10) {
      throw new Error(`Item ${item.id} has insufficient content for embedding`);
    }

    logger.log(`Processing embedding for ${item.type} ${item.id}`, {
      title: item.title.substring(0, 50),
      contentLength: item.content.length
    });

    // Call our batch-generate-embeddings edge function
    const { data, error } = await supabase.functions.invoke('batch-generate-embeddings', {
      body: {
        items: [{
          id: item.id,
          type: item.type,
          text: textToEmbed
        }]
      }
    });

    if (error) {
      throw new Error(`Embedding generation failed for ${item.id}: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(`Embedding generation unsuccessful for ${item.id}: ${data?.error || 'Unknown error'}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus(): EmbeddingProcessingStatus {
    return { ...this.status };
  }

  async getOverallStats() {
    try {
      // Get stats for each type
      const [articlesStats, documentsStats, provisionsStats] = await Promise.all([
        supabase
          .from('knowledge_articles')  
          .select('id, embedding')
          .eq('status', 'published'),
        
        supabase
          .from('legal_documents')
          .select('id, embedding')
          .eq('is_active', true),
          
        supabase
          .from('legal_provisions')
          .select('id, embedding')
          .eq('is_active', true)
      ]);

      const stats = {
        knowledge_articles: {
          total: articlesStats.data?.length || 0,
          with_embeddings: articlesStats.data?.filter(item => item.embedding).length || 0,
          missing_embeddings: articlesStats.data?.filter(item => !item.embedding).length || 0
        },
        legal_documents: {
          total: documentsStats.data?.length || 0,
          with_embeddings: documentsStats.data?.filter(item => item.embedding).length || 0,
          missing_embeddings: documentsStats.data?.filter(item => !item.embedding).length || 0
        },
        legal_provisions: {
          total: provisionsStats.data?.length || 0,
          with_embeddings: provisionsStats.data?.filter(item => item.embedding).length || 0,
          missing_embeddings: provisionsStats.data?.filter(item => !item.embedding).length || 0
        }
      };

      const totalMissing = stats.knowledge_articles.missing_embeddings + 
                          stats.legal_documents.missing_embeddings + 
                          stats.legal_provisions.missing_embeddings;

      return { ...stats, total_missing: totalMissing };

    } catch (error) {
      logger.error('Error getting overall stats:', error);
      return {
        knowledge_articles: { total: 0, with_embeddings: 0, missing_embeddings: 0 },
        legal_documents: { total: 0, with_embeddings: 0, missing_embeddings: 0 },
        legal_provisions: { total: 0, with_embeddings: 0, missing_embeddings: 0 },
        total_missing: 0
      };
    }
  }
}