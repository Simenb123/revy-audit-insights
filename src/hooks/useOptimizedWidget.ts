import { useMemo, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/utils/logger';
import type { Widget, WidgetLayout } from '@/types/widget';

interface UseOptimizedWidgetOptions {
  enableVirtualization?: boolean;
  throttleMs?: number;
  memoizeDependencies?: any[];
}

interface WidgetPerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

export function useOptimizedWidget(
  widget: Widget,
  layout: WidgetLayout,
  options: UseOptimizedWidgetOptions = {}
) {
  const {
    enableVirtualization = true,
    throttleMs = 100,
    memoizeDependencies = [],
  } = options;

  const renderCountRef = useRef(0);
  const performanceRef = useRef<WidgetPerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
  });
  const lastUpdateRef = useRef(0);

  // Memoized widget configuration
  const memoizedConfig = useMemo(() => {
    const startTime = performance.now();
    
    const config = {
      id: widget.id,
      type: widget.type,
      title: widget.title,
      config: widget.config,
      layout: {
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
      },
      data: widget.data,
      metadata: widget.metadata,
    };

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Update performance metrics
    performanceRef.current.renderCount++;
    performanceRef.current.lastRenderTime = renderTime;
    performanceRef.current.totalRenderTime += renderTime;
    performanceRef.current.averageRenderTime = 
      performanceRef.current.totalRenderTime / performanceRef.current.renderCount;

    if (renderTime > 16) { // Warn if render takes longer than 1 frame
      logger.warn(`Widget ${widget.id} slow render: ${renderTime.toFixed(2)}ms`);
    }

    return config;
  }, [
    widget.id,
    widget.type,
    widget.title,
    widget.config,
    widget.data,
    widget.metadata,
    layout.x,
    layout.y,
    layout.w,
    layout.h,
    ...memoizeDependencies,
  ]);

  // Throttled update function
  const throttledUpdate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (updateFn: () => void) => {
        const now = Date.now();
        if (now - lastUpdateRef.current >= throttleMs) {
          updateFn();
          lastUpdateRef.current = now;
        } else {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            updateFn();
            lastUpdateRef.current = Date.now();
          }, throttleMs - (now - lastUpdateRef.current));
        }
      };
    })(),
    [throttleMs]
  );

  // Memoized style calculations
  const memoizedStyles = useMemo(() => {
    return {
      position: 'absolute' as const,
      left: layout.x * 100,
      top: layout.y * 100,
      width: layout.w * 100,
      height: layout.h * 100,
      transition: 'all 0.3s ease',
    };
  }, [layout.x, layout.y, layout.w, layout.h]);

  // Virtualization helpers
  const isVisible = useMemo(() => {
    if (!enableVirtualization) return true;
    
    // Simple viewport-based visibility check
    const viewport = {
      top: 0,
      left: 0,
      bottom: window.innerHeight,
      right: window.innerWidth,
    };

    const widgetBounds = {
      top: layout.y * 100,
      left: layout.x * 100,
      bottom: (layout.y + layout.h) * 100,
      right: (layout.x + layout.w) * 100,
    };

    return !(
      widgetBounds.bottom < viewport.top ||
      widgetBounds.top > viewport.bottom ||
      widgetBounds.right < viewport.left ||
      widgetBounds.left > viewport.right
    );
  }, [layout, enableVirtualization]);

  // Performance monitoring
  const getPerformanceMetrics = useCallback(() => {
    return { ...performanceRef.current };
  }, []);

  // Cleanup effect
  useEffect(() => {
    renderCountRef.current++;
    
    return () => {
      // Log performance metrics on unmount
      const metrics = performanceRef.current;
      if (metrics.renderCount > 0) {
        logger.debug(`Widget ${widget.id} performance:`, {
          renders: metrics.renderCount,
          avgRenderTime: metrics.averageRenderTime.toFixed(2) + 'ms',
          totalTime: metrics.totalRenderTime.toFixed(2) + 'ms',
        });
      }
    };
  }, [widget.id]);

  return {
    config: memoizedConfig,
    styles: memoizedStyles,
    isVisible,
    throttledUpdate,
    getPerformanceMetrics,
    renderCount: renderCountRef.current,
  };
}

// Hook for batch widget operations
export function useBatchWidgetOperations<T>(
  items: T[],
  batchSize: number = 50,
  delayMs: number = 0
) {
  const processInBatches = useCallback(
    async (processor: (batch: T[]) => Promise<void> | void) => {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await processor(batch);
        
        if (delayMs > 0 && i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    },
    [items, batchSize, delayMs]
  );

  return { processInBatches };
}

// Hook for optimized widget list rendering
export function useOptimizedWidgetList(widgets: Widget[], layouts: WidgetLayout[]) {
  const memoizedWidgets = useMemo(() => {
    const layoutMap = new Map(layouts.map(layout => [layout.widgetId, layout]));
    
    return widgets.map(widget => ({
      widget,
      layout: layoutMap.get(widget.id),
    })).filter(item => item.layout);
  }, [widgets, layouts]);

  const visibleWidgets = useMemo(() => {
    // Sort by y-position for better rendering order
    return memoizedWidgets.sort((a, b) => 
      (a.layout?.y || 0) - (b.layout?.y || 0)
    );
  }, [memoizedWidgets]);

  return {
    widgets: visibleWidgets,
    count: visibleWidgets.length,
  };
}