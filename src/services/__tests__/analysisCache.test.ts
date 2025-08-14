import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnalysisCache } from '../analysisCache';

describe('AnalysisCache', () => {
  let cache: AnalysisCache;

  beforeEach(() => {
    cache = new AnalysisCache();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic operations', () => {
    it('should store and retrieve data', () => {
      const key = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const data = { result: 'test data' };

      cache.set(key, data);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const key = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const retrieved = cache.get(key);

      expect(retrieved).toBeNull();
    });

    it('should check if key exists', () => {
      const key = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const data = { result: 'test data' };

      expect(cache.has(key)).toBe(false);
      
      cache.set(key, data);
      expect(cache.has(key)).toBe(true);
    });

    it('should generate different keys for different parameters', () => {
      const key1 = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const key2 = { clientId: 'client2', dataVersionId: 'version1', analysisType: 'basic' };
      const data1 = { result: 'data1' };
      const data2 = { result: 'data2' };

      cache.set(key1, data1);
      cache.set(key2, data2);

      expect(cache.get(key1)).toEqual(data1);
      expect(cache.get(key2)).toEqual(data2);
    });
  });

  describe('expiration', () => {
    it('should expire entries after TTL', () => {
      const key = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const data = { result: 'test data' };
      const ttl = 5000; // 5 seconds

      cache.set(key, data, ttl);
      expect(cache.get(key)).toEqual(data);

      // Fast forward time beyond TTL
      vi.advanceTimersByTime(ttl + 1000);
      expect(cache.get(key)).toBeNull();
    });

    it('should not expire entries before TTL', () => {
      const key = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const data = { result: 'test data' };
      const ttl = 5000; // 5 seconds

      cache.set(key, data, ttl);
      
      // Fast forward time but not beyond TTL
      vi.advanceTimersByTime(ttl - 1000);
      expect(cache.get(key)).toEqual(data);
    });

    it('should clean up expired entries', () => {
      const key1 = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const key2 = { clientId: 'client2', dataVersionId: 'version1', analysisType: 'basic' };
      const data = { result: 'test data' };
      const shortTtl = 1000;
      const longTtl = 10000;

      cache.set(key1, data, shortTtl);
      cache.set(key2, data, longTtl);

      // Advance time to expire first entry
      vi.advanceTimersByTime(shortTtl + 500);

      // Accessing should trigger cleanup
      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toEqual(data);

      const stats = cache.getStats();
      expect(stats.activeEntries).toBe(1);
    });
  });

  describe('invalidation', () => {
    it('should invalidate by client ID', () => {
      const key1 = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const key2 = { clientId: 'client2', dataVersionId: 'version1', analysisType: 'basic' };
      const data = { result: 'test data' };

      cache.set(key1, data);
      cache.set(key2, data);

      cache.invalidate({ clientId: 'client1' });

      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toEqual(data);
    });

    it('should invalidate by data version ID', () => {
      const key1 = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const key2 = { clientId: 'client1', dataVersionId: 'version2', analysisType: 'basic' };
      const data = { result: 'test data' };

      cache.set(key1, data);
      cache.set(key2, data);

      cache.invalidate({ dataVersionId: 'version1' });

      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toEqual(data);
    });

    it('should invalidate by analysis type', () => {
      const key1 = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const key2 = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'advanced' };
      const data = { result: 'test data' };

      cache.set(key1, data);
      cache.set(key2, data);

      cache.invalidate({ analysisType: 'basic' });

      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toEqual(data);
    });

    it('should clear all entries', () => {
      const key1 = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const key2 = { clientId: 'client2', dataVersionId: 'version2', analysisType: 'advanced' };
      const data = { result: 'test data' };

      cache.set(key1, data);
      cache.set(key2, data);

      cache.clear();

      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toBeNull();
    });
  });

  describe('size limits', () => {
    it('should remove oldest entries when cache is full', () => {
      const data = { result: 'test data' };
      
      // Fill cache beyond max size (assuming MAX_CACHE_SIZE = 100)
      for (let i = 0; i < 102; i++) {
        const key = { 
          clientId: `client${i}`, 
          dataVersionId: 'version1', 
          analysisType: 'basic' 
        };
        cache.set(key, data);
      }

      // First entries should be evicted
      const firstKey = { clientId: 'client0', dataVersionId: 'version1', analysisType: 'basic' };
      const lastKey = { clientId: 'client101', dataVersionId: 'version1', analysisType: 'basic' };

      expect(cache.get(firstKey)).toBeNull();
      expect(cache.get(lastKey)).toEqual(data);
    });
  });

  describe('statistics', () => {
    it('should provide cache statistics', () => {
      const key1 = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const key2 = { clientId: 'client2', dataVersionId: 'version1', analysisType: 'basic' };
      const data = { result: 'test data' };

      cache.set(key1, data);
      cache.set(key2, data);

      const stats = cache.getStats();
      
      expect(stats.totalEntries).toBe(2);
      expect(stats.activeEntries).toBe(2);
      expect(stats.expiredEntries).toBe(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should track expired entries in statistics', () => {
      const key = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const data = { result: 'test data' };
      const ttl = 1000;

      cache.set(key, data, ttl);
      
      // Advance time to expire entry
      vi.advanceTimersByTime(ttl + 500);

      const stats = cache.getStats();
      expect(stats.expiredEntries).toBe(1);
      expect(stats.activeEntries).toBe(0);
    });
  });

  describe('configuration hash', () => {
    it('should differentiate cache entries by configuration', () => {
      const baseKey = { clientId: 'client1', dataVersionId: 'version1', analysisType: 'basic' };
      const key1 = { ...baseKey, configHash: 'config1' };
      const key2 = { ...baseKey, configHash: 'config2' };
      const data1 = { result: 'data1' };
      const data2 = { result: 'data2' };

      cache.set(key1, data1);
      cache.set(key2, data2);

      expect(cache.get(key1)).toEqual(data1);
      expect(cache.get(key2)).toEqual(data2);
    });
  });
});