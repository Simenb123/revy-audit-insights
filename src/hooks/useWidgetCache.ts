import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
}

interface CacheOptions {
  maxSize?: number;
  defaultTTL?: number; // Time to live in milliseconds
  cleanupInterval?: number;
}

export function useWidgetCache<T>(options: CacheOptions = {}) {
  const {
    maxSize = 50,
    defaultTTL = 5 * 60 * 1000, // 5 minutes
    cleanupInterval = 60 * 1000 // 1 minute
  } = options;

  const cache = useRef(new Map<string, CacheEntry<T>>());
  const [cacheStats, setCacheStats] = useState({
    size: 0,
    hits: 0,
    misses: 0,
    evictions: 0
  });

  // Cleanup expired entries
  const cleanup = useCallback(() => {
    const now = Date.now();
    const toDelete: string[] = [];
    
    cache.current.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => {
      cache.current.delete(key);
    });

    if (toDelete.length > 0) {
      setCacheStats(prev => ({ 
        ...prev, 
        size: cache.current.size,
        evictions: prev.evictions + toDelete.length
      }));
    }
  }, []);

  // Set up cleanup interval
  useEffect(() => {
    const interval = setInterval(cleanup, cleanupInterval);
    return () => clearInterval(interval);
  }, [cleanup, cleanupInterval]);

  // Evict least recently used items when cache is full
  const evictLRU = useCallback(() => {
    if (cache.current.size < maxSize) return;

    let lruKey: string | null = null;
    let lruTimestamp = Date.now();

    cache.current.forEach((entry, key) => {
      if (entry.timestamp < lruTimestamp) {
        lruTimestamp = entry.timestamp;
        lruKey = key;
      }
    });

    if (lruKey) {
      cache.current.delete(lruKey);
      setCacheStats(prev => ({ 
        ...prev, 
        size: cache.current.size,
        evictions: prev.evictions + 1
      }));
    }
  }, [maxSize]);

  const get = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    
    if (!entry) {
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    const now = Date.now();
    
    if (now > entry.expiresAt) {
      cache.current.delete(key);
      setCacheStats(prev => ({ 
        ...prev, 
        misses: prev.misses + 1,
        size: cache.current.size
      }));
      return null;
    }

    // Update hit count and timestamp
    entry.hits += 1;
    entry.timestamp = now;
    
    setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    return entry.data;
  }, []);

  const set = useCallback((key: string, data: T, ttl?: number): void => {
    const now = Date.now();
    const expiresAt = now + (ttl || defaultTTL);

    evictLRU();

    cache.current.set(key, {
      data,
      timestamp: now,
      expiresAt,
      hits: 0
    });

    setCacheStats(prev => ({ ...prev, size: cache.current.size }));
  }, [defaultTTL, evictLRU]);

  const remove = useCallback((key: string): boolean => {
    const existed = cache.current.delete(key);
    if (existed) {
      setCacheStats(prev => ({ ...prev, size: cache.current.size }));
    }
    return existed;
  }, []);

  const clear = useCallback(() => {
    cache.current.clear();
    setCacheStats({ size: 0, hits: 0, misses: 0, evictions: 0 });
  }, []);

  const has = useCallback((key: string): boolean => {
    const entry = cache.current.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now > entry.expiresAt) {
      cache.current.delete(key);
      setCacheStats(prev => ({ ...prev, size: cache.current.size }));
      return false;
    }
    
    return true;
  }, []);

  const getStats = useCallback(() => {
    const totalRequests = cacheStats.hits + cacheStats.misses;
    const hitRate = totalRequests > 0 ? (cacheStats.hits / totalRequests) * 100 : 0;
    
    return {
      ...cacheStats,
      hitRate: hitRate.toFixed(1) + '%',
      totalRequests
    };
  }, [cacheStats]);

  return {
    get,
    set,
    remove,
    clear,
    has,
    cleanup,
    stats: getStats()
  };
}