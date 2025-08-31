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
  delayBetweenBatches: number;
  maxRetries: number;
  prioritizeByImportance: boolean;
}

const DEFAULT_OPTIONS: BatchProcessingOptions = {
  batchSize: 10,
  delayBetweenBatches: 2000,
  maxRetries: 3,
  prioritizeByImportance: true
};

interface EmbeddingItem {
  id: string;
  type: 'knowledge_article' | 'legal_provision' | 'legal_document';
  title: string;
  content: string;
  priority: number;
}

export class SmartEmbeddingsProcessor {
  private status: EmbeddingProcessingStatus;
  private statusCallbacks: Array<(status: EmbeddingProcessingStatus) => void>;

  constructor() {
    this.status = {
      total: 0,
      processed: 0,
      failed: 0,
      inProgress: false,
      currentBatch: 0,
      totalBatches: 0,
      estimatedTimeRemaining: 0
    };
    this.statusCallbacks = [];
  }

  onStatusUpdate(callback: (status: EmbeddingProcessingStatus) => void) {
    this.statusCallbacks.push(callback);
  }

  private updateStatus(updates: Partial<EmbeddingProcessingStatus>) {
    this.status.total = updates.total ?? this.status.total;
    this.status.processed = updates.processed ?? this.status.processed;
    this.status.failed = updates.failed ?? this.status.failed;
    this.status.inProgress = updates.inProgress ?? this.status.inProgress;
    this.status.currentBatch = updates.currentBatch ?? this.status.currentBatch;
    this.status.totalBatches = updates.totalBatches ?? this.status.totalBatches;
    this.status.estimatedTimeRemaining = updates.estimatedTimeRemaining ?? this.status.estimatedTimeRemaining;
    
    this.statusCallbacks.forEach(callback => callback(this.status));
  }

  async processAllMissingEmbeddings(options: Partial<BatchProcessingOptions> = {}) {
    const opts = {
      batchSize: options.batchSize ?? DEFAULT_OPTIONS.batchSize,
      delayBetweenBatches: options.delayBetweenBatches ?? DEFAULT_OPTIONS.delayBetweenBatches,
      maxRetries: options.maxRetries ?? DEFAULT_OPTIONS.maxRetries,
      prioritizeByImportance: options.prioritizeByImportance ?? DEFAULT_OPTIONS.prioritizeByImportance
    };
    
    try {
      console.log('Starting smart embeddings processing', opts);
      this.updateStatus({ inProgress: true, processed: 0, failed: 0 });

      const missingItems = await this.getMissingEmbeddingsWithPriority();
      
      if (missingItems.length === 0) {
        console.log('No missing embeddings found');
        this.updateStatus({ inProgress: false });
        return { success: true, message: 'Ingen manglende embeddings funnet' };
      }

      const totalBatches = Math.ceil(missingItems.length / opts.batchSize);
      this.updateStatus({ 
        total: missingItems.length, 
        totalBatches: totalBatches,
        estimatedTimeRemaining: totalBatches * (opts.delayBetweenBatches + 5000)
      });

      console.log(`Processing ${missingItems.length} items in ${totalBatches} batches`);

      for (let i = 0; i < missingItems.length; i += opts.batchSize) {
        const batch = missingItems.slice(i, i + opts.batchSize);
        const batchNumber = Math.floor(i / opts.batchSize) + 1;
        
        this.updateStatus({ 
          currentBatch: batchNumber,
          estimatedTimeRemaining: (totalBatches - batchNumber) * (opts.delayBetweenBatches + 5000)
        });

        console.log(`Processing batch ${batchNumber}/${totalBatches}`, { batchSize: batch.length });

        try {
          await this.processBatch(batch, opts.maxRetries);
        } catch (error) {
          console.error(`Batch ${batchNumber} failed:`, error);
          this.updateStatus({ failed: this.status.failed + batch.length });
        }

        if (i + opts.batchSize < missingItems.length) {
          await this.delay(opts.delayBetweenBatches);
        }
      }

      this.updateStatus({ inProgress: false, estimatedTimeRemaining: 0 });
      
      console.log('Smart embeddings processing completed', {
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
      console.error('Smart embeddings processing failed:', error);
      this.updateStatus({ inProgress: false });
      throw error;
    }
  }

  private async getMissingEmbeddingsWithPriority(): Promise<EmbeddingItem[]> {
    const missingItems: EmbeddingItem[] = [];

    // Knowledge articles
    const articlesResponse = await supabase
      .from('knowledge_articles')
      .select('id, title, content')
      .eq('status', 'published')
      .is('embedding', null);

    if (articlesResponse.data) {
      for (const article of articlesResponse.data) {
        missingItems.push({
          id: article.id,
          type: 'knowledge_article',
          title: article.title,
          content: article.content || '',
          priority: 1
        });
      }
    }

    // Legal documents  
    const documentsResponse = await supabase
      .from('legal_documents')
      .select('id, title, content')
      .eq('is_active', true)
      .is('embedding', null);

    if (documentsResponse.data) {
      for (const doc of documentsResponse.data) {
        missingItems.push({
          id: doc.id,
          type: 'legal_document',
          title: doc.title,
          content: doc.content || '',
          priority: 2
        });
      }
    }

    // Legal provisions
    const provisionsResponse = await supabase
      .from('legal_provisions')
      .select('id, title, content, law_identifier, provision_number')
      .eq('is_active', true)
      .is('embedding', null)
      .limit(500);

    if (provisionsResponse.data) {
      for (const provision of provisionsResponse.data) {
        const priority = provision.law_identifier?.toLowerCase().includes('isa') ? 2 : 3;
        missingItems.push({
          id: provision.id,
          type: 'legal_provision',
          title: `${provision.law_identifier} ${provision.provision_number}: ${provision.title}`,
          content: provision.content || '',
          priority: priority
        });
      }
    }

    return missingItems.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.content.length - b.content.length;
    });
  }

  private async processBatch(items: EmbeddingItem[], maxRetries: number) {
    const batchPromises = items.map(async (item) => {
      let attempts = 0;
      while (attempts < maxRetries) {
        try {
          await this.processItem(item);
          this.updateStatus({ processed: this.status.processed + 1 });
          return;
        } catch (error) {
          attempts++;
          console.warn(`Item ${item.id} failed attempt ${attempts}:`, error);
          
          if (attempts >= maxRetries) {
            console.error(`Item ${item.id} failed after ${maxRetries} attempts:`, error);
            this.updateStatus({ failed: this.status.failed + 1 });
            throw error;
          }
          
          await this.delay(1000 * Math.pow(2, attempts));
        }
      }
    });

    await Promise.allSettled(batchPromises);
  }

  private async processItem(item: EmbeddingItem) {
    const textToEmbed = `${item.title}\n\n${item.content}`.trim();
    
    if (!textToEmbed || textToEmbed.length < 10) {
      throw new Error(`Item ${item.id} has insufficient content for embedding`);
    }

    console.log(`Processing embedding for ${item.type} ${item.id}`);

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
    return {
      total: this.status.total,
      processed: this.status.processed,
      failed: this.status.failed,
      inProgress: this.status.inProgress,
      currentBatch: this.status.currentBatch,
      totalBatches: this.status.totalBatches,
      estimatedTimeRemaining: this.status.estimatedTimeRemaining
    };
  }

  async getOverallStats() {
    try {
      const articlesResult = await supabase
        .from('knowledge_articles')
        .select('id, embedding')
        .eq('status', 'published');

      const documentsResult = await supabase
        .from('legal_documents')
        .select('id, embedding')
        .eq('is_active', true);

      const provisionsResult = await supabase
        .from('legal_provisions')
        .select('id, embedding')
        .eq('is_active', true);

      const articlesData: any[] = articlesResult.data || [];
      const documentsData: any[] = documentsResult.data || [];  
      const provisionsData: any[] = provisionsResult.data || [];

      const articlesTotal = articlesData.length;
      const articlesWithEmbeddings = articlesData.filter((item: any) => item.embedding).length;
      
      const documentsTotal = documentsData.length;
      const documentsWithEmbeddings = documentsData.filter((item: any) => item.embedding).length;
      
      const provisionsTotal = provisionsData.length;
      const provisionsWithEmbeddings = provisionsData.filter((item: any) => item.embedding).length;

      const articlesMissing = articlesTotal - articlesWithEmbeddings;
      const documentsMissing = documentsTotal - documentsWithEmbeddings;
      const provisionsMissing = provisionsTotal - provisionsWithEmbeddings;

      return {
        knowledge_articles: {
          total: articlesTotal,
          with_embeddings: articlesWithEmbeddings,
          missing_embeddings: articlesMissing
        },
        legal_documents: {
          total: documentsTotal,
          with_embeddings: documentsWithEmbeddings,
          missing_embeddings: documentsMissing
        },
        legal_provisions: {
          total: provisionsTotal,
          with_embeddings: provisionsWithEmbeddings,
          missing_embeddings: provisionsMissing
        },
        total_missing: articlesMissing + documentsMissing + provisionsMissing
      };

    } catch (error) {
      console.error('Error getting overall stats:', error);
      return {
        knowledge_articles: { total: 0, with_embeddings: 0, missing_embeddings: 0 },
        legal_documents: { total: 0, with_embeddings: 0, missing_embeddings: 0 },
        legal_provisions: { total: 0, with_embeddings: 0, missing_embeddings: 0 },
        total_missing: 0
      };
    }
  }
}