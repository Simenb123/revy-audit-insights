import { supabase } from '@/integrations/supabase/client';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  accessCount: number;
  cacheHits: number;
}

interface CacheKey {
  clientId: string;
  analysisType: string;
  configHash: string;
}

export class EnhancedCacheService {
  private localCache = new Map<string, CacheEntry<any>>();
  private readonly LOCAL_TTL = 2 * 60 * 1000; // 2 minutes local cache
  private readonly MAX_LOCAL_CACHE_SIZE = 50;

  private generateKey(key: CacheKey): string {
    return `${key.clientId}_${key.analysisType}_${key.configHash}`;
  }

  private generateConfigHash(config: any): string {
    if (!config) return 'default';
    return btoa(JSON.stringify(config)).slice(0, 16);
  }

  async get<T>(key: CacheKey): Promise<T | null> {
    const cacheKey = this.generateKey(key);
    
    // Check local cache first (fastest)
    const localEntry = this.localCache.get(cacheKey);
    if (localEntry && Date.now() < localEntry.expiresAt) {
      localEntry.accessCount++;
      localEntry.cacheHits++;
      console.log(`[Cache] Local hit for ${cacheKey}`);
      return localEntry.data;
    }

    // Check Supabase cache
    try {
      const { data: cacheData, error } = await supabase
        .from('ai_analysis_cache')
        .select('result_data, expires_at, access_count')
        .eq('client_id', key.clientId)
        .eq('analysis_type', key.analysisType)
        .eq('config_hash', key.configHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!error && cacheData) {
        console.log(`[Cache] Supabase hit for ${cacheKey}`);
        
        // Update access count in background
        const updatePromise = supabase
          .from('ai_analysis_cache')
          .update({ 
            access_count: (cacheData.access_count || 0) + 1,
            last_accessed: new Date().toISOString()
          })
          .eq('client_id', key.clientId)
          .eq('analysis_type', key.analysisType)
          .eq('config_hash', key.configHash);
        
        // Handle update promise without blocking
        updatePromise.then(
          () => {},
          (error) => console.warn('[Cache] Failed to update access count:', error)
        );
        
        // Store in local cache for faster subsequent access
        this.setLocal(cacheKey, cacheData.result_data as T);
        
        return cacheData.result_data as T;
      }
    } catch (error) {
      console.warn(`[Cache] Supabase cache error:`, error);
    }

    console.log(`[Cache] Miss for ${cacheKey}`);
    return null;
  }

  async set<T>(key: CacheKey, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    const cacheKey = this.generateKey(key);
    
    // Store in local cache
    this.setLocal(cacheKey, data);
    
    // Store in Supabase cache
    try {
      const expiresAt = new Date(Date.now() + ttl);
      
      const { error: upsertError } = await supabase
        .from('ai_analysis_cache')
        .upsert({
          client_id: key.clientId,
          analysis_type: key.analysisType,
          config_hash: key.configHash,
          data_version_id: 'default',
          result_data: data as any,
          expires_at: expiresAt.toISOString(),
          access_count: 1,
          confidence_score: 0.95,
          transaction_count: 0 // Will be updated by backend if needed
        }, {
          onConflict: 'client_id,analysis_type,config_hash'
        });
      
      if (upsertError) {
        console.error(`[Cache] Failed to store in Supabase:`, upsertError);
      } else {
        console.log(`[Cache] Stored ${cacheKey} in Supabase with TTL ${ttl}ms`);
      }
    } catch (error) {
      console.error(`[Cache] Failed to store in Supabase:`, error);
    }
  }

  private setLocal<T>(cacheKey: string, data: T): void {
    // Cleanup expired local entries
    this.cleanupLocal();
    
    // If local cache is full, remove oldest entry
    if (this.localCache.size >= this.MAX_LOCAL_CACHE_SIZE) {
      const oldestKey = Array.from(this.localCache.keys())[0];
      this.localCache.delete(oldestKey);
    }

    this.localCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + this.LOCAL_TTL,
      accessCount: 1,
      cacheHits: 0
    });
  }

  private cleanupLocal(): void {
    const now = Date.now();
    const expiredKeys = Array.from(this.localCache.entries())
      .filter(([_, entry]) => now > entry.expiresAt)
      .map(([key]) => key);

    expiredKeys.forEach(key => this.localCache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`[Cache] Cleaned up ${expiredKeys.length} expired local entries`);
    }
  }

  async invalidate(key: Partial<CacheKey>): Promise<void> {
    // Invalidate local cache
    const keysToDelete = Array.from(this.localCache.keys()).filter(cacheKey => {
      if (key.clientId && !cacheKey.includes(key.clientId)) return false;
      if (key.analysisType && !cacheKey.includes(key.analysisType)) return false;
      if (key.configHash && !cacheKey.includes(key.configHash)) return false;
      return true;
    });

    keysToDelete.forEach(key => this.localCache.delete(key));
    
    // Invalidate Supabase cache
    try {
      let query = supabase.from('ai_analysis_cache').delete();
      
      if (key.clientId) query = query.eq('client_id', key.clientId);
      if (key.analysisType) query = query.eq('analysis_type', key.analysisType);
      if (key.configHash) query = query.eq('config_hash', key.configHash);
      
      await query;
      console.log(`[Cache] Invalidated cache entries matching:`, key);
    } catch (error) {
      console.error(`[Cache] Failed to invalidate Supabase cache:`, error);
    }
  }

  getStats() {
    const now = Date.now();
    const localEntries = Array.from(this.localCache.entries());
    const expired = localEntries.filter(([_, entry]) => now > entry.expiresAt).length;
    const totalHits = localEntries.reduce((sum, [_, entry]) => sum + entry.cacheHits, 0);
    const totalAccesses = localEntries.reduce((sum, [_, entry]) => sum + entry.accessCount, 0);
    
    return {
      localCacheSize: this.localCache.size,
      expiredEntries: expired,
      activeEntries: this.localCache.size - expired,
      hitRate: totalAccesses > 0 ? (totalHits / totalAccesses * 100).toFixed(1) + '%' : '0%',
      memoryUsage: JSON.stringify(localEntries).length
    };
  }
}

export const cacheService = new EnhancedCacheService();