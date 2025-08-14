import { useCallback, useEffect, useState } from 'react';
import { analysisCache } from '@/services/analysisCache';

interface UseCacheOptions {
  ttl?: number;
  backgroundRefresh?: boolean;
}

interface CacheKey {
  clientId: string;
  dataVersionId: string;
  analysisType: string;
  configHash?: string;
}

export function useAnalysisCache<T>(
  cacheKey: CacheKey, 
  fetchFn: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const { ttl = 5 * 60 * 1000, backgroundRefresh = true } = options;

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Try cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedData = analysisCache.get<T>(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setIsFromCache(true);
          setIsLoading(false);

          // Background refresh if enabled
          if (backgroundRefresh) {
            fetchFn().then(freshData => {
              analysisCache.set(cacheKey, freshData, ttl);
              setData(freshData);
              setIsFromCache(false);
            }).catch(console.error);
          }
          return;
        }
      }

      // Fetch fresh data
      const freshData = await fetchFn();
      analysisCache.set(cacheKey, freshData, ttl);
      setData(freshData);
      setIsFromCache(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cache error');
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, fetchFn, ttl, backgroundRefresh]);

  const invalidateCache = useCallback(() => {
    analysisCache.invalidate(cacheKey);
    fetchData(true);
  }, [cacheKey, fetchData]);

  const refreshData = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isFromCache,
    invalidateCache,
    refreshData
  };
}