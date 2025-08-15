import { useCallback, useEffect, useState } from 'react';
import { widgetCacheService, WidgetCacheConfig } from '@/services/widgetCacheService';
import { useDebounce } from './useDebounce';

interface UseIntelligentCacheOptions extends WidgetCacheConfig {
  enabled?: boolean;
  refetchOnMount?: boolean;
  staleTime?: number;
}

interface CacheState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
  lastFetched: number | null;
  isFetching: boolean;
}

export function useIntelligentCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options: UseIntelligentCacheOptions = {}
) {
  const {
    enabled = true,
    refetchOnMount = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    ttl = 10 * 60 * 1000, // 10 minutes
    backgroundRefresh = true,
    priority = 'medium',
    dependencies = []
  } = options;

  const [state, setState] = useState<CacheState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isStale: false,
    lastFetched: null,
    isFetching: false
  });

  // Debounce rapid cache key changes
  const debouncedCacheKey = useDebounce(cacheKey, 100);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled || (!forceRefresh && state.isFetching)) return;

    setState(prev => ({ 
      ...prev, 
      isLoading: prev.data === null,
      isFetching: true,
      error: null 
    }));

    try {
      const data = await widgetCacheService.get(
        debouncedCacheKey,
        fetchFn,
        { ttl, backgroundRefresh, priority, dependencies }
      );

      setState({
        data,
        isLoading: false,
        error: null,
        isStale: false,
        lastFetched: Date.now(),
        isFetching: false
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
        isFetching: false
      }));
    }
  }, [enabled, debouncedCacheKey, fetchFn, ttl, backgroundRefresh, priority, dependencies, state.isFetching]);

  const invalidateCache = useCallback(() => {
    widgetCacheService.invalidate(debouncedCacheKey);
    fetchData(true);
  }, [debouncedCacheKey, fetchData]);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Auto-fetch on mount or cache key change
  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    }
  }, [debouncedCacheKey, enabled, refetchOnMount]);

  // Check for stale data periodically
  useEffect(() => {
    if (!enabled || !state.lastFetched) return;

    const checkStaleData = () => {
      const now = Date.now();
      const isStale = now - state.lastFetched! > staleTime;
      
      if (isStale && !state.isStale) {
        setState(prev => ({ ...prev, isStale: true }));
      }
    };

    const interval = setInterval(checkStaleData, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [enabled, state.lastFetched, staleTime, state.isStale]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    isStale: state.isStale,
    isFetching: state.isFetching,
    invalidateCache,
    refetch,
    // Cache-specific utilities
    cacheKey: debouncedCacheKey,
    lastFetched: state.lastFetched
  };
}

// Hook for prefetching data
export function useCachePrefetch() {
  const prefetch = useCallback(async <T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    options: WidgetCacheConfig = {}
  ) => {
    try {
      await widgetCacheService.get(cacheKey, fetchFn, options);
    } catch (error) {
      console.warn(`[CachePrefetch] Failed to prefetch ${cacheKey}:`, error);
    }
  }, []);

  return { prefetch };
}

// Hook for cache management
export function useCacheManager() {
  const [stats, setStats] = useState(widgetCacheService.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(widgetCacheService.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const invalidatePattern = useCallback((pattern: string | string[]) => {
    widgetCacheService.invalidate(pattern);
    setStats(widgetCacheService.getStats());
  }, []);

  const clearAll = useCallback(() => {
    widgetCacheService.invalidate();
    setStats(widgetCacheService.getStats());
  }, []);

  return {
    stats,
    invalidatePattern,
    clearAll
  };
}