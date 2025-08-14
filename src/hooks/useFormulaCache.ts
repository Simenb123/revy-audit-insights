import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface CacheEntry {
  key: string;
  result: any;
  timestamp: number;
  hits: number;
}

interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  enablePersistence: boolean;
}

export function useFormulaCache(config: CacheConfig = {
  maxSize: 100,
  ttl: 5 * 60 * 1000, // 5 minutes
  enablePersistence: true
}) {
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const queryClient = useQueryClient();

  // Load cache from localStorage on mount
  useEffect(() => {
    if (config.enablePersistence) {
      try {
        const stored = localStorage.getItem('formula-calculation-cache');
        if (stored) {
          const entries = JSON.parse(stored);
          const cacheMap = new Map<string, CacheEntry>();
          
          entries.forEach(([key, entry]: [string, CacheEntry]) => {
            // Only load if not expired
            if (Date.now() - entry.timestamp < config.ttl) {
              cacheMap.set(key, entry);
            }
          });
          
          setCache(cacheMap);
        }
      } catch (error) {
        console.warn('Failed to load formula cache from localStorage:', error);
      }
    }
  }, [config.enablePersistence, config.ttl]);

  // Persist cache to localStorage
  const persistCache = useCallback((cacheMap: Map<string, CacheEntry>) => {
    if (config.enablePersistence) {
      try {
        const entries = Array.from(cacheMap.entries());
        localStorage.setItem('formula-calculation-cache', JSON.stringify(entries));
      } catch (error) {
        console.warn('Failed to persist formula cache:', error);
      }
    }
  }, [config.enablePersistence]);

  // Clean up expired entries
  const cleanupExpired = useCallback((cacheMap: Map<string, CacheEntry>) => {
    const now = Date.now();
    const toDelete: string[] = [];
    
    cacheMap.forEach((entry, key) => {
      if (now - entry.timestamp > config.ttl) {
        toDelete.push(key);
      }
    });
    
    toDelete.forEach(key => cacheMap.delete(key));
    return cacheMap;
  }, [config.ttl]);

  // LRU eviction when cache is full
  const evictLRU = useCallback((cacheMap: Map<string, CacheEntry>) => {
    if (cacheMap.size >= config.maxSize) {
      // Find least recently used (lowest hits, then oldest)
      let lruKey = '';
      let minHits = Infinity;
      let oldestTime = Infinity;
      
      cacheMap.forEach((entry, key) => {
        if (entry.hits < minHits || (entry.hits === minHits && entry.timestamp < oldestTime)) {
          lruKey = key;
          minHits = entry.hits;
          oldestTime = entry.timestamp;
        }
      });
      
      if (lruKey) {
        cacheMap.delete(lruKey);
      }
    }
    return cacheMap;
  }, [config.maxSize]);

  const generateCacheKey = useCallback((
    formula: string,
    clientId: string,
    fiscalYear: string,
    additionalParams?: Record<string, any>
  ): string => {
    const baseKey = `${formula}|${clientId}|${fiscalYear}`;
    if (additionalParams) {
      const paramStr = JSON.stringify(additionalParams);
      return `${baseKey}|${paramStr}`;
    }
    return baseKey;
  }, []);

  const get = useCallback((key: string) => {
    const entry = cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > config.ttl) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        persistCache(newCache);
        return newCache;
      });
      return null;
    }
    
    // Update hit count
    setCache(prev => {
      const newCache = new Map(prev);
      const updatedEntry = { ...entry, hits: entry.hits + 1 };
      newCache.set(key, updatedEntry);
      persistCache(newCache);
      return newCache;
    });
    
    return entry.result;
  }, [cache, config.ttl, persistCache]);

  const set = useCallback((key: string, result: any) => {
    setCache(prev => {
      let newCache = new Map(prev);
      
      // Cleanup expired entries first
      newCache = cleanupExpired(newCache);
      
      // Evict LRU if needed
      newCache = evictLRU(newCache);
      
      // Add new entry
      const entry: CacheEntry = {
        key,
        result,
        timestamp: Date.now(),
        hits: 1
      };
      
      newCache.set(key, entry);
      persistCache(newCache);
      return newCache;
    });
  }, [cleanupExpired, evictLRU, persistCache]);

  const clear = useCallback(() => {
    setCache(new Map());
    if (config.enablePersistence) {
      localStorage.removeItem('formula-calculation-cache');
    }
    
    // Also clear related React Query cache
    queryClient.invalidateQueries({ queryKey: ['formula-calculation'] });
  }, [config.enablePersistence, queryClient]);

  const getStats = useCallback(() => {
    const entries = Array.from(cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const avgHits = entries.length > 0 ? totalHits / entries.length : 0;
    
    return {
      size: cache.size,
      maxSize: config.maxSize,
      totalHits,
      avgHits: Math.round(avgHits * 100) / 100,
      oldestEntry: entries.reduce((oldest, entry) => 
        entry.timestamp < oldest ? entry.timestamp : oldest, 
        Date.now()
      ),
      hitRate: entries.length > 0 ? avgHits / entries.length : 0
    };
  }, [cache, config.maxSize]);

  const optimizeCache = useCallback(() => {
    setCache(prev => {
      let newCache = new Map(prev);
      
      // Remove expired entries
      newCache = cleanupExpired(newCache);
      
      // Remove entries with very low hit count if cache is large
      if (newCache.size > config.maxSize * 0.8) {
        const entries = Array.from(newCache.entries());
        const avgHits = entries.reduce((sum, [, entry]) => sum + entry.hits, 0) / entries.length;
        
        entries.forEach(([key, entry]) => {
          if (entry.hits < avgHits * 0.5) {
            newCache.delete(key);
          }
        });
      }
      
      persistCache(newCache);
      return newCache;
    });
  }, [cleanupExpired, config.maxSize, persistCache]);

  // Auto-optimize cache periodically
  useEffect(() => {
    const interval = setInterval(optimizeCache, 60000); // Every minute
    return () => clearInterval(interval);
  }, [optimizeCache]);

  return {
    get,
    set,
    clear,
    generateCacheKey,
    getStats,
    optimizeCache,
    cacheSize: cache.size
  };
}