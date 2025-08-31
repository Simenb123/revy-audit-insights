import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
  metadata?: any;
}

interface CacheStrategy {
  name: string;
  ttl: number;
  maxSize?: number;
  compression?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  averageResponseTime: number;
}

export class AdvancedCacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
    averageResponseTime: 0
  };
  
  private strategies: Record<string, CacheStrategy> = {
    'context-analysis': {
      name: 'Context Analysis Cache',
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 100,
      compression: true,
      priority: 'high'
    },
    'prompt-enhancement': {
      name: 'Prompt Enhancement Cache',
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 200,
      compression: false,
      priority: 'high'
    },
    'ai-responses': {
      name: 'AI Response Cache',
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 50,
      compression: true,
      priority: 'medium'
    },
    'document-analysis': {
      name: 'Document Analysis Cache',
      ttl: 60 * 60 * 1000, // 1 hour
      maxSize: 25,
      compression: true,
      priority: 'medium'
    },
    'knowledge-search': {
      name: 'Knowledge Search Cache',
      ttl: 2 * 60 * 60 * 1000, // 2 hours
      maxSize: 150,
      compression: true,
      priority: 'low'
    }
  };

  constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000);
  }

  /**
   * Get cached data with intelligent fallback strategies
   */
  async get<T>(key: string, strategyName: string): Promise<T | null> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Try memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isValid(memoryEntry)) {
        this.metrics.hits++;
        this.updateMetrics(Date.now() - startTime);
        logger.log(`🎯 Cache HIT (memory): ${key}`);
        return this.decompressData(memoryEntry.data, strategyName);
      }

      // Try database cache for persistent storage
      const dbEntry = await this.getFromDatabase(key);
      if (dbEntry) {
        // Store in memory for faster future access
        this.setInMemory(key, dbEntry.data, strategyName, dbEntry.metadata);
        this.metrics.hits++;
        this.updateMetrics(Date.now() - startTime);
        logger.log(`🎯 Cache HIT (database): ${key}`);
        return this.decompressData(dbEntry.data, strategyName);
      }

      this.metrics.misses++;
      this.updateMetrics(Date.now() - startTime);
      logger.log(`❌ Cache MISS: ${key}`);
      return null;

    } catch (error) {
      logger.error('Cache get error:', error);
      this.metrics.misses++;
      return null;
    }
  }

  /**
   * Set cached data with intelligent storage strategy
   */
  async set<T>(key: string, data: T, strategyName: string, metadata?: any): Promise<void> {
    const strategy = this.strategies[strategyName];
    if (!strategy) {
      logger.error(`Unknown cache strategy: ${strategyName}`);
      return;
    }

    try {
      // Compress data if strategy requires it
      const processedData = this.compressData(data, strategyName);
      
      // Store in memory
      this.setInMemory(key, processedData, strategyName, metadata);

      // Store in database for persistence (async, don't wait)
      this.setInDatabase(key, processedData, strategy, metadata).catch(error => {
        logger.error('Database cache set error:', error);
      });

      logger.log(`💾 Cache SET: ${key} (strategy: ${strategyName})`);

    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  /**
   * Invalidate cache entries by pattern or exact key
   */
  async invalidate(pattern: string | RegExp): Promise<number> {
    let invalidatedCount = 0;

    try {
      // Invalidate memory cache
      if (typeof pattern === 'string') {
        if (this.memoryCache.has(pattern)) {
          this.memoryCache.delete(pattern);
          invalidatedCount++;
        }
      } else {
        for (const key of this.memoryCache.keys()) {
          if (pattern.test(key)) {
            this.memoryCache.delete(key);
            invalidatedCount++;
          }
        }
      }

      // Invalidate database cache
      const dbInvalidated = await this.invalidateInDatabase(pattern);
      invalidatedCount += dbInvalidated;

      logger.log(`🗑️ Cache invalidated: ${invalidatedCount} entries`);
      return invalidatedCount;

    } catch (error) {
      logger.error('Cache invalidation error:', error);
      return invalidatedCount;
    }
  }

  /**
   * Get cache metrics and performance statistics
   */
  getMetrics(): CacheMetrics & { hitRate: number; strategies: Record<string, CacheStrategy> } {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      hitRate,
      strategies: this.strategies
    };
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(keys: string[], strategyName: string): Promise<void> {
    logger.log(`🔥 Warming up cache for ${keys.length} keys`);
    
    for (const key of keys) {
      try {
        await this.get(key, strategyName);
      } catch (error) {
        logger.error(`Cache warmup failed for key ${key}:`, error);
      }
    }
  }

  // Private methods

  private setInMemory<T>(key: string, data: T, strategyName: string, metadata?: any): void {
    const strategy = this.strategies[strategyName];
    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: strategy.ttl,
      version: '1.0',
      metadata
    };

    this.memoryCache.set(key, entry);
    this.enforceMemoryLimits(strategyName);
  }

  private async setInDatabase<T>(key: string, data: T, strategy: CacheStrategy, metadata?: any): Promise<void> {
    try {
      // Simplified database caching - skip for now to avoid schema issues
      // In production, ensure the database schema matches the required fields
      logger.log(`💾 Database cache set skipped for ${key} (schema compatibility)`);
    } catch (error) {
      logger.error('Database cache set error:', error);
    }
  }

  private async getFromDatabase(key: string): Promise<{ data: any; metadata?: any } | null> {
    try {
      // Simplified database caching - skip for now to avoid schema issues
      // In production, ensure the database schema matches the required fields
      logger.log(`🔍 Database cache get skipped for ${key} (schema compatibility)`);
      return null;
    } catch (error) {
      logger.error('Database cache get error:', error);
      return null;
    }
  }

  private async invalidateInDatabase(pattern: string | RegExp): Promise<number> {
    try {
      // Simplified database invalidation - skip for now to avoid schema issues
      logger.log(`🗑️ Database cache invalidation skipped (schema compatibility)`);
      return 0;
    } catch (error) {
      logger.error('Database cache invalidation error:', error);
      return 0;
    }
  }

  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private enforceMemoryLimits(strategyName: string): void {
    const strategy = this.strategies[strategyName];
    if (!strategy.maxSize) return;

    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp); // Oldest first

    while (entries.length > strategy.maxSize) {
      const [oldestKey] = entries.shift()!;
      this.memoryCache.delete(oldestKey);
      this.metrics.evictions++;
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  private compressData<T>(data: T, strategyName: string): T {
    const strategy = this.strategies[strategyName];
    if (!strategy.compression) return data;
    
    // Simple compression for large objects
    if (typeof data === 'object' && JSON.stringify(data).length > 10000) {
      // In a real implementation, you might use a compression library
      return data;
    }
    return data;
  }

  private decompressData<T>(data: T, strategyName: string): T {
    const strategy = this.strategies[strategyName];
    if (!strategy.compression) return data;
    
    // Decompression logic would go here
    return data;
  }

  private updateMetrics(responseTime: number): void {
    const oldAvg = this.metrics.averageResponseTime;
    const totalRequests = this.metrics.totalRequests;
    
    this.metrics.averageResponseTime = 
      (oldAvg * (totalRequests - 1) + responseTime) / totalRequests;
  }
}

// Export singleton instance
export const advancedCacheManager = new AdvancedCacheManager();