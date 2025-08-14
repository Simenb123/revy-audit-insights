interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheKey {
  clientId: string;
  dataVersionId: string;
  analysisType: string;
  configHash?: string;
}

export class AnalysisCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 100;

  private generateKey(key: CacheKey): string {
    return `${key.clientId}:${key.dataVersionId}:${key.analysisType}:${key.configHash || 'default'}`;
  }

  private generateConfigHash(config: any): string {
    if (!config) return 'default';
    return btoa(JSON.stringify(config)).slice(0, 16);
  }

  set<T>(key: CacheKey, data: T, ttl: number = this.DEFAULT_TTL): void {
    const cacheKey = this.generateKey(key);
    const now = Date.now();
    
    // Cleanup expired entries before adding new one
    this.cleanup();
    
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });

    console.log(`[AnalysisCache] Cached ${cacheKey} with TTL ${ttl}ms`);
  }

  get<T>(key: CacheKey): T | null {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(cacheKey);
      console.log(`[AnalysisCache] Expired and removed ${cacheKey}`);
      return null;
    }

    console.log(`[AnalysisCache] Cache hit for ${cacheKey}`);
    return entry.data;
  }

  has(key: CacheKey): boolean {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) return false;
    
    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return false;
    }
    
    return true;
  }

  invalidate(key: Partial<CacheKey>): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(cacheKey => {
      if (key.clientId && !cacheKey.includes(key.clientId)) return false;
      if (key.dataVersionId && !cacheKey.includes(key.dataVersionId)) return false;
      if (key.analysisType && !cacheKey.includes(key.analysisType)) return false;
      return true;
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`[AnalysisCache] Invalidated ${key}`);
    });
  }

  clear(): void {
    this.cache.clear();
    console.log('[AnalysisCache] Cleared all cache entries');
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys = Array.from(this.cache.entries())
      .filter(([_, entry]) => now > entry.expiresAt)
      .map(([key]) => key);

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`[AnalysisCache] Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    const expired = entries.filter(([_, entry]) => now > entry.expiresAt).length;
    
    return {
      totalEntries: this.cache.size,
      expiredEntries: expired,
      activeEntries: this.cache.size - expired,
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }
}

export const analysisCache = new AnalysisCache();