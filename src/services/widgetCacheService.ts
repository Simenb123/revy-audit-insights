import { analysisCache } from './analysisCache';
import { useAnalysisCache } from '@/hooks/useAnalysisCache';

export interface WidgetCacheConfig {
  ttl?: number;
  backgroundRefresh?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dependencies?: string[];
}

export interface CachedWidgetData<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  priority: number;
  dependencies: string[];
  lastRefreshed: number;
}

export class WidgetCacheService {
  private static instance: WidgetCacheService;
  private cache = new Map<string, CachedWidgetData>();
  private refreshQueue = new Set<string>();
  private maxCacheSize = 200;
  private priorityWeights = { low: 1, medium: 2, high: 3 };

  static getInstance(): WidgetCacheService {
    if (!WidgetCacheService.instance) {
      WidgetCacheService.instance = new WidgetCacheService();
    }
    return WidgetCacheService.instance;
  }

  private constructor() {
    // Start background cleanup
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    setInterval(() => this.processRefreshQueue(), 5000); // Process refresh queue every 5 seconds
  }

  generateCacheKey(
    clientId: string, 
    widgetType: string, 
    config?: Record<string, any>
  ): string {
    const configHash = config ? btoa(JSON.stringify(config)).slice(0, 16) : 'default';
    return `widget:${clientId}:${widgetType}:${configHash}`;
  }

  async get<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    config: WidgetCacheConfig = {}
  ): Promise<T> {
    const {
      ttl = 10 * 60 * 1000, // 10 minutes default
      backgroundRefresh = true,
      priority = 'medium',
      dependencies = []
    } = config;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && now < cached.expiresAt) {
      // Schedule background refresh if enabled and data is getting stale
      if (backgroundRefresh && now > cached.lastRefreshed + (ttl * 0.7)) {
        this.scheduleBackgroundRefresh(cacheKey, fetchFn, config);
      }
      return cached.data;
    }

    // Fetch fresh data
    try {
      const data = await fetchFn();
      this.set(cacheKey, data, { ttl, priority, dependencies });
      return data;
    } catch (error) {
      // Return stale data if available
      if (cached) {
        console.warn(`[WidgetCache] Using stale data for ${cacheKey} due to error:`, error);
        return cached.data;
      }
      throw error;
    }
  }

  set<T>(
    cacheKey: string, 
    data: T, 
    config: Pick<WidgetCacheConfig, 'ttl' | 'priority' | 'dependencies'> = {}
  ): void {
    const {
      ttl = 10 * 60 * 1000,
      priority = 'medium',
      dependencies = []
    } = config;

    const now = Date.now();
    
    // Evict if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastImportant();
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      priority: this.priorityWeights[priority],
      dependencies,
      lastRefreshed: now
    });

    console.log(`[WidgetCache] Cached ${cacheKey} with priority ${priority}`);
  }

  invalidate(pattern?: string | string[]): void {
    if (!pattern) {
      this.cache.clear();
      console.log('[WidgetCache] Cleared all cache');
      return;
    }

    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    let deletedCount = 0;

    for (const [key, value] of this.cache.entries()) {
      const shouldDelete = patterns.some(p => 
        key.includes(p) || value.dependencies.some(dep => dep.includes(p))
      );
      
      if (shouldDelete) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    console.log(`[WidgetCache] Invalidated ${deletedCount} cache entries`);
  }

  private scheduleBackgroundRefresh(
    cacheKey: string,
    fetchFn: () => Promise<any>,
    config: WidgetCacheConfig
  ): void {
    if (this.refreshQueue.has(cacheKey)) return;
    
    this.refreshQueue.add(cacheKey);
    
    // Process immediately if queue is small
    if (this.refreshQueue.size <= 2) {
      this.processRefreshQueue();
    }
  }

  private async processRefreshQueue(): Promise<void> {
    if (this.refreshQueue.size === 0) return;

    // Process up to 3 items at once
    const items = Array.from(this.refreshQueue).slice(0, 3);
    
    await Promise.allSettled(
      items.map(async (cacheKey) => {
        try {
          // Note: In real implementation, we'd need to store the fetchFn
          // For now, we'll just remove from queue
          this.refreshQueue.delete(cacheKey);
        } catch (error) {
          console.error(`[WidgetCache] Background refresh failed for ${cacheKey}:`, error);
          this.refreshQueue.delete(cacheKey);
        }
      })
    );
  }

  private evictLeastImportant(): void {
    let leastImportant: [string, CachedWidgetData] | null = null;
    let lowestScore = Infinity;

    for (const [key, value] of this.cache.entries()) {
      // Score based on priority and age
      const age = Date.now() - value.timestamp;
      const score = value.priority - (age / 1000000); // Reduce score with age
      
      if (score < lowestScore) {
        lowestScore = score;
        leastImportant = [key, value];
      }
    }

    if (leastImportant) {
      this.cache.delete(leastImportant[0]);
      console.log(`[WidgetCache] Evicted ${leastImportant[0]} (score: ${lowestScore})`);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[WidgetCache] Cleaned up ${cleaned} expired entries`);
    }
  }

  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    return {
      totalEntries: this.cache.size,
      expiredEntries: entries.filter(e => now > e.expiresAt).length,
      refreshQueueSize: this.refreshQueue.size,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length,
      priorityDistribution: {
        high: entries.filter(e => e.priority === 3).length,
        medium: entries.filter(e => e.priority === 2).length,
        low: entries.filter(e => e.priority === 1).length,
      }
    };
  }
}

export const widgetCacheService = WidgetCacheService.getInstance();