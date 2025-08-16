import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { useOptimizedWidget } from '@/hooks/useOptimizedWidget';
import { useWidgetMemoryManagement } from '@/hooks/useMemoryManagement';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';

interface PerformanceOptimizedWidgetProps {
  widget: Widget;
  layout: WidgetLayout;
  children: React.ReactNode;
  isSelected?: boolean;
  onSelect?: (widgetId: string) => void;
  onResize?: (widgetId: string, size: { w: number; h: number }) => void;
  onMove?: (widgetId: string, position: { x: number; y: number }) => void;
  enableVirtualization?: boolean;
  enableLazyLoading?: boolean;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: Error; reset: () => void }>;
}

const PerformanceOptimizedWidget = memo<PerformanceOptimizedWidgetProps>(function PerformanceOptimizedWidget({
  widget,
  layout,
  children,
  isSelected = false,
  onSelect,
  onResize,
  onMove,
  enableVirtualization = true,
  enableLazyLoading = true,
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Performance optimization hooks
  const {
    config,
    styles,
    isVisible,
    throttledUpdate,
    getPerformanceMetrics,
  } = useOptimizedWidget(widget, layout, {
    enableVirtualization,
    throttleMs: 100,
    memoizeDependencies: [isSelected],
  });

  // Memory management
  const {
    addToCache,
    clearCache,
    addEventListenerCleanup,
    getMemoryInfo,
  } = useWidgetMemoryManagement(widget.id);

  // Intersection observer for lazy loading
  const { elementRef: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });
  
  // Use container ref or intersection ref
  const finalRef = enableLazyLoading ? intersectionRef : containerRef;
  
  const hasIntersected = isIntersecting;

  // Memoized event handlers
  const handleClick = useCallback(() => {
    throttledUpdate(() => {
      onSelect?.(widget.id);
    });
  }, [onSelect, widget.id, throttledUpdate]);

  const handleResize = useCallback((size: { w: number; h: number }) => {
    throttledUpdate(() => {
      onResize?.(widget.id, size);
    });
  }, [onResize, widget.id, throttledUpdate]);

  const handleMove = useCallback((position: { x: number; y: number }) => {
    throttledUpdate(() => {
      onMove?.(widget.id, position);
    });
  }, [onMove, widget.id, throttledUpdate]);

  // Memoized CSS classes
  const containerClasses = useMemo(() => {
    return [
      'relative',
      'transition-all',
      'duration-300',
      'ease-in-out',
      isSelected && 'ring-2 ring-primary ring-opacity-50',
      !isVisible && enableVirtualization && 'opacity-0',
    ].filter(Boolean).join(' ');
  }, [isSelected, isVisible, enableVirtualization]);

  // Register mouse event cleanup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseEnter = () => {
      container.style.transform = 'scale(1.02)';
    };

    const handleMouseLeave = () => {
      container.style.transform = 'scale(1)';
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    addEventListenerCleanup(() => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    });
  }, [addEventListenerCleanup]);

  // Performance monitoring
  useEffect(() => {
    const metrics = getPerformanceMetrics();
    if (metrics.renderCount > 50) {
      console.warn(`Widget ${widget.id} has rendered ${metrics.renderCount} times`);
    }
  }, [getPerformanceMetrics, widget.id]);

  // Early return for virtualization
  if (enableVirtualization && !isVisible) {
    return (
      <div
        ref={containerRef}
        style={styles}
        className={containerClasses}
        aria-hidden="true"
      />
    );
  }

  // Early return for lazy loading
  if (enableLazyLoading && !hasIntersected) {
    return (
      <div
        ref={finalRef as React.RefObject<HTMLDivElement>}
        style={styles}
        className={containerClasses}
      >
        <Card className="h-full w-full flex items-center justify-center">
          {LoadingComponent ? (
            <LoadingComponent />
          ) : (
            <div className="space-y-3 w-full p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
        </Card>
      </div>
    );
  }

  const widgetContent = (
    <div
      ref={finalRef as React.RefObject<HTMLDivElement>}
      style={styles}
      className={containerClasses}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Widget: ${widget.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <Card className="h-full w-full overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Widget Header */}
          <div className="p-3 border-b border-border/20 bg-card/50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm truncate">{widget.title}</h3>
              {widget.autoRefresh && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>

          {/* Widget Content */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </Card>
    </div>
  );

  return widgetContent;
});

// Additional optimization: React.memo with custom comparison
export const OptimizedWidget = memo(PerformanceOptimizedWidget, (prevProps, nextProps) => {
  // Custom comparison for better performance
  const widgetChanged = 
    prevProps.widget.id !== nextProps.widget.id ||
    prevProps.widget.title !== nextProps.widget.title ||
    prevProps.widget.type !== nextProps.widget.type ||
    JSON.stringify(prevProps.widget.config) !== JSON.stringify(nextProps.widget.config);

  const layoutChanged =
    prevProps.layout.x !== nextProps.layout.x ||
    prevProps.layout.y !== nextProps.layout.y ||
    prevProps.layout.w !== nextProps.layout.w ||
    prevProps.layout.h !== nextProps.layout.h;

  const propsChanged =
    prevProps.isSelected !== nextProps.isSelected ||
    prevProps.enableVirtualization !== nextProps.enableVirtualization ||
    prevProps.enableLazyLoading !== nextProps.enableLazyLoading;

  return !(widgetChanged || layoutChanged || propsChanged);
});

export default OptimizedWidget;