import { useState, useEffect, useRef, useCallback } from 'react';

interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export function useLazyLoad<T extends HTMLElement>(
  options: LazyLoadOptions = {}
) {
  const { threshold = 0.1, rootMargin = '50px', enabled = true } = options;
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled || hasBeenVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasBeenVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const element = elementRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, enabled, hasBeenVisible]);

  return {
    elementRef,
    isVisible,
    hasBeenVisible,
  };
}

// Hook for lazy loading data
export function useLazyData<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { elementRef, hasBeenVisible } = useLazyLoad();

  const loadData = useCallback(async () => {
    if (loading || data) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fetcher, loading, data]);

  useEffect(() => {
    if (hasBeenVisible) {
      loadData();
    }
  }, [hasBeenVisible, loadData, ...dependencies]);

  return {
    elementRef,
    data,
    loading,
    error,
    refetch: loadData,
  };
}