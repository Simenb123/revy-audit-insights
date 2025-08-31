import { logger } from '@/utils/logger';
import { advancedCacheManager } from './advancedCacheManager';

export interface BatchTask<T, R> {
  id: string;
  data: T;
  priority: 'low' | 'medium' | 'high';
  retryCount: number;
  maxRetries: number;
  timeout: number;
  dependencies?: string[]; // Other task IDs this depends on
  cacheKey?: string;
  metadata?: any;
}

export interface BatchProcessingResult<R> {
  taskId: string;
  success: boolean;
  data?: R;
  error?: string;
  duration: number;
  fromCache: boolean;
}

export interface BatchProcessingOptions {
  concurrency: number;
  batchSize: number;
  delayBetweenBatches: number;
  enableCaching: boolean;
  cacheStrategy: string;
  retryDelayMs: number;
  priorityWeighting: boolean;
}

interface ProcessingStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  cachedResults: number;
  averageProcessingTime: number;
  throughput: number; // tasks per second
}

export class BatchProcessingManager<T, R> {
  private taskQueue: BatchTask<T, R>[] = [];
  private processingTasks: Set<string> = new Set();
  private completedTasks: Map<string, BatchProcessingResult<R>> = new Map();
  private stats: ProcessingStats = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    cachedResults: 0,
    averageProcessingTime: 0,
    throughput: 0
  };
  
  private startTime: number = 0;
  private statusCallbacks: Array<(stats: ProcessingStats) => void> = [];

  constructor(
    private processor: (data: T) => Promise<R>,
    private options: BatchProcessingOptions = {
      concurrency: 3,
      batchSize: 10,
      delayBetweenBatches: 1000,
      enableCaching: true,
      cacheStrategy: 'document-analysis',
      retryDelayMs: 2000,
      priorityWeighting: true
    }
  ) {}

  /**
   * Add tasks to the processing queue
   */
  addTasks(tasks: Omit<BatchTask<T, R>, 'retryCount'>[]): void {
    const newTasks: BatchTask<T, R>[] = tasks.map(task => ({
      ...task,
      retryCount: 0,
      maxRetries: task.maxRetries || 2,
      timeout: task.timeout || 30000
    }));

    this.taskQueue.push(...newTasks);
    this.stats.totalTasks += newTasks.length;
    
    logger.log(`📋 Added ${newTasks.length} tasks to batch queue`);
    this.notifyStatusUpdate();
  }

  /**
   * Start batch processing with intelligent scheduling
   */
  async startProcessing(): Promise<BatchProcessingResult<R>[]> {
    if (this.taskQueue.length === 0) {
      logger.warn('No tasks to process');
      return [];
    }

    this.startTime = Date.now();
    logger.log(`🚀 Starting batch processing of ${this.taskQueue.length} tasks`);

    // Sort tasks by priority and dependencies
    this.taskQueue = this.sortTasksByPriority(this.taskQueue);

    const results: BatchProcessingResult<R>[] = [];
    const batches = this.createBatches(this.taskQueue);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.log(`📦 Processing batch ${i + 1}/${batches.length} with ${batch.length} tasks`);

      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);

      // Update stats
      this.updateStats(batchResults);
      this.notifyStatusUpdate();

      // Delay between batches (except for the last one)
      if (i < batches.length - 1 && this.options.delayBetweenBatches > 0) {
        await this.delay(this.options.delayBetweenBatches);
      }
    }

    const totalTime = Date.now() - this.startTime;
    this.stats.throughput = this.stats.completedTasks / (totalTime / 1000);
    
    logger.log(`✅ Batch processing completed in ${totalTime}ms`);
    logger.log(`📊 Success rate: ${(this.stats.completedTasks / this.stats.totalTasks * 100).toFixed(1)}%`);
    
    return results;
  }

  /**
   * Process a single batch with concurrency control
   */
  private async processBatch(batch: BatchTask<T, R>[]): Promise<BatchProcessingResult<R>[]> {
    const semaphore = new Semaphore(this.options.concurrency);
    const promises = batch.map(task => 
      semaphore.acquire().then(async (release) => {
        try {
          return await this.processTask(task);
        } finally {
          release();
        }
      })
    );

    return Promise.all(promises);
  }

  /**
   * Process a single task with caching and retry logic
   */
  private async processTask(task: BatchTask<T, R>): Promise<BatchProcessingResult<R>> {
    const startTime = Date.now();
    this.processingTasks.add(task.id);

    try {
      // Check cache first if enabled
      if (this.options.enableCaching && task.cacheKey) {
        const cachedResult = await advancedCacheManager.get<R>(
          task.cacheKey, 
          this.options.cacheStrategy
        );
        
        if (cachedResult) {
          logger.log(`🎯 Cache hit for task ${task.id}`);
          return {
            taskId: task.id,
            success: true,
            data: cachedResult,
            duration: Date.now() - startTime,
            fromCache: true
          };
        }
      }

      // Check dependencies
      if (task.dependencies) {
        await this.waitForDependencies(task.dependencies);
      }

      // Process the task with timeout
      const result = await Promise.race([
        this.processor(task.data),
        this.timeoutPromise<R>(task.timeout)
      ]);

      // Cache the result if caching is enabled
      if (this.options.enableCaching && task.cacheKey && result) {
        await advancedCacheManager.set(
          task.cacheKey,
          result,
          this.options.cacheStrategy,
          task.metadata
        );
      }

      const duration = Date.now() - startTime;
      const taskResult: BatchProcessingResult<R> = {
        taskId: task.id,
        success: true,
        data: result,
        duration,
        fromCache: false
      };

      this.completedTasks.set(task.id, taskResult);
      logger.log(`✅ Task ${task.id} completed in ${duration}ms`);
      
      return taskResult;

    } catch (error) {
      logger.error(`❌ Task ${task.id} failed:`, error);
      
      // Retry logic
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        logger.log(`🔄 Retrying task ${task.id} (attempt ${task.retryCount}/${task.maxRetries})`);
        
        await this.delay(this.options.retryDelayMs * task.retryCount);
        return this.processTask(task);
      }

      const duration = Date.now() - startTime;
      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
        fromCache: false
      };
      
    } finally {
      this.processingTasks.delete(task.id);
    }
  }

  /**
   * Sort tasks by priority and handle dependencies
   */
  private sortTasksByPriority(tasks: BatchTask<T, R>[]): BatchTask<T, R>[] {
    if (!this.options.priorityWeighting) return tasks;

    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return tasks.sort((a, b) => {
      // First sort by dependencies (tasks with no dependencies first)
      const aDeps = a.dependencies?.length || 0;
      const bDeps = b.dependencies?.length || 0;
      
      if (aDeps !== bDeps) {
        return aDeps - bDeps;
      }

      // Then sort by priority
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Create batches from the task queue
   */
  private createBatches(tasks: BatchTask<T, R>[]): BatchTask<T, R>[][] {
    const batches: BatchTask<T, R>[][] = [];
    
    for (let i = 0; i < tasks.length; i += this.options.batchSize) {
      batches.push(tasks.slice(i, i + this.options.batchSize));
    }
    
    return batches;
  }

  /**
   * Wait for task dependencies to complete
   */
  private async waitForDependencies(dependencies: string[]): Promise<void> {
    const checkInterval = 100; // Check every 100ms
    const maxWaitTime = 30000; // Max 30 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const allCompleted = dependencies.every(depId => 
        this.completedTasks.has(depId) || !this.processingTasks.has(depId)
      );

      if (allCompleted) return;

      await this.delay(checkInterval);
    }

    throw new Error(`Timeout waiting for dependencies: ${dependencies.join(', ')}`);
  }

  /**
   * Update processing statistics
   */
  private updateStats(results: BatchProcessingResult<R>[]): void {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const cached = results.filter(r => r.fromCache).length;
    const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    this.stats.completedTasks += successful;
    this.stats.failedTasks += failed;
    this.stats.cachedResults += cached;
    
    // Update running average
    const totalCompleted = this.stats.completedTasks + this.stats.failedTasks;
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (totalCompleted - results.length) + avgTime * results.length) / totalCompleted;
  }

  /**
   * Get current processing statistics
   */
  getStats(): ProcessingStats {
    return { ...this.stats };
  }

  /**
   * Subscribe to status updates
   */
  onStatusUpdate(callback: (stats: ProcessingStats) => void): void {
    this.statusCallbacks.push(callback);
  }

  private notifyStatusUpdate(): void {
    this.statusCallbacks.forEach(callback => callback(this.getStats()));
  }

  private async timeoutPromise<T>(ms: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Task timed out after ${ms}ms`)), ms);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Simple semaphore implementation for concurrency control
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    if (this.permits > 0) {
      this.permits--;
      return () => this.release();
    }

    return new Promise(resolve => {
      this.waitQueue.push(() => {
        this.permits--;
        resolve(() => this.release());
      });
    });
  }

  private release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      next();
    }
  }
}