import { useState, useEffect, useRef, useCallback } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

interface VirtualizedWidget {
  id: string;
  isVisible: boolean;
  isLoaded: boolean;
  priority: number;
  lastSeen: number;
}

interface UseWidgetVirtualizationOptions {
  threshold?: number;
  rootMargin?: string;
  maxConcurrentLoads?: number;
  preloadCount?: number;
}

export function useWidgetVirtualization(
  widgetIds: string[],
  options: UseWidgetVirtualizationOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    maxConcurrentLoads = 3,
    preloadCount = 2
  } = options;

  const [widgets, setWidgets] = useState<Map<string, VirtualizedWidget>>(new Map());
  const [loadingQueue, setLoadingQueue] = useState<string[]>([]);
  const [currentlyLoading, setCurrentlyLoading] = useState(new Set<string>());
  const observers = useRef(new Map<string, IntersectionObserver>());

  // Initialize widgets
  useEffect(() => {
    const newWidgets = new Map<string, VirtualizedWidget>();
    widgetIds.forEach((id, index) => {
      newWidgets.set(id, {
        id,
        isVisible: false,
        isLoaded: false,
        priority: index < preloadCount ? 1 : 0,
        lastSeen: 0
      });
    });
    setWidgets(newWidgets);
  }, [widgetIds, preloadCount]);

  // Create intersection observer for each widget
  const observeWidget = useCallback((element: HTMLElement, widgetId: string) => {
    if (observers.current.has(widgetId)) {
      observers.current.get(widgetId)?.unobserve(element);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setWidgets(prev => {
          const updated = new Map(prev);
          const widget = updated.get(widgetId);
          if (widget) {
            updated.set(widgetId, {
              ...widget,
              isVisible: entry.isIntersecting,
              lastSeen: entry.isIntersecting ? Date.now() : widget.lastSeen
            });
          }
          return updated;
        });

        if (entry.isIntersecting) {
          setLoadingQueue(prev => {
            if (!prev.includes(widgetId)) {
              return [...prev, widgetId];
            }
            return prev;
          });
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    observers.current.set(widgetId, observer);

    return () => {
      observer.unobserve(element);
      observers.current.delete(widgetId);
    };
  }, [threshold, rootMargin]);

  // Process loading queue
  useEffect(() => {
    if (loadingQueue.length === 0 || currentlyLoading.size >= maxConcurrentLoads) {
      return;
    }

    const nextWidget = loadingQueue[0];
    const widget = widgets.get(nextWidget);

    if (widget && !widget.isLoaded && !currentlyLoading.has(nextWidget)) {
      setCurrentlyLoading(prev => new Set([...prev, nextWidget]));
      setLoadingQueue(prev => prev.slice(1));

      // Simulate async loading (you'd replace this with actual data fetching)
      setTimeout(() => {
        setWidgets(prev => {
          const updated = new Map(prev);
          const w = updated.get(nextWidget);
          if (w) {
            updated.set(nextWidget, { ...w, isLoaded: true });
          }
          return updated;
        });

        setCurrentlyLoading(prev => {
          const updated = new Set(prev);
          updated.delete(nextWidget);
          return updated;
        });
      }, 100);
    }
  }, [loadingQueue, currentlyLoading, maxConcurrentLoads, widgets]);

  // Cleanup observers
  useEffect(() => {
    return () => {
      observers.current.forEach(observer => observer.disconnect());
      observers.current.clear();
    };
  }, []);

  const getWidgetState = useCallback((widgetId: string) => {
    return widgets.get(widgetId) || {
      id: widgetId,
      isVisible: false,
      isLoaded: false,
      priority: 0,
      lastSeen: 0
    };
  }, [widgets]);

  const shouldRenderWidget = useCallback((widgetId: string) => {
    const widget = widgets.get(widgetId);
    return widget?.isVisible || widget?.isLoaded || false;
  }, [widgets]);

  return {
    observeWidget,
    getWidgetState,
    shouldRenderWidget,
    isLoading: currentlyLoading.size > 0,
    loadingCount: currentlyLoading.size
  };
}