import React, { useMemo, useRef, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useWidgetVirtualization } from '@/hooks/useWidgetVirtualization';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { WidgetRenderer } from './WidgetRenderer';
import { Widget } from '@/contexts/WidgetManagerContext';
import { PerformanceMonitor } from './PerformanceMonitor';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface VirtualizedDashboardProps {
  widgets: Widget[];
  layouts: { [key: string]: Layout[] };
  onLayoutChange: (layout: Layout[], layouts: { [key: string]: Layout[] }) => void;
  isViewMode?: boolean;
  breakpoints?: { lg: number; md: number; sm: number; xs: number };
  cols?: { lg: number; md: number; sm: number; xs: number };
  className?: string;
}

interface VirtualizedWidgetProps {
  widget: Widget;
  isVisible: boolean;
  isLoaded: boolean;
  onObserve: (element: HTMLElement) => void;
}

function VirtualizedWidget({ widget, isVisible, isLoaded, onObserve }: VirtualizedWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      onObserve(ref.current);
    }
  }, [onObserve]);

  return (
    <div ref={ref} className="h-full w-full">
      {isLoaded ? (
        <WidgetRenderer widget={widget} />
      ) : isVisible ? (
        <div className="h-full w-full p-4 border border-border rounded-lg bg-card animate-fade-in">
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-full w-full" />
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center border border-border rounded-lg bg-card/50">
          <div className="text-muted-foreground text-sm">Widget loading...</div>
        </div>
      )}
    </div>
  );
}

export function VirtualizedDashboard({
  widgets,
  layouts,
  onLayoutChange,
  isViewMode = false,
  breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480 },
  cols = { lg: 12, md: 10, sm: 6, xs: 4 },
  className
}: VirtualizedDashboardProps) {
  const { metrics } = usePerformanceMonitor('VirtualizedDashboard');
  
  const widgetIds = useMemo(() => widgets.map(w => w.id), [widgets]);
  
  const {
    observeWidget,
    getWidgetState,
    shouldRenderWidget,
    isLoading,
    loadingCount
  } = useWidgetVirtualization(widgetIds, {
    threshold: 0.1,
    rootMargin: '100px',
    maxConcurrentLoads: 3,
    preloadCount: 2
  });

  const gridElements = useMemo(() => {
    return widgets.map((widget) => {
      const state = getWidgetState(widget.id);
      
      return (
        <div key={widget.id} className="animate-scale-in">
          <VirtualizedWidget
            widget={widget}
            isVisible={state.isVisible}
            isLoaded={state.isLoaded}
            onObserve={(element) => observeWidget(element, widget.id)}
          />
        </div>
      );
    });
  }, [widgets, getWidgetState, observeWidget]);

  return (
    <div className={cn('relative', className)}>
      {/* Performance Monitor (Development only) */}
      <PerformanceMonitor 
        componentName="VirtualizedDashboard"
        className="absolute top-0 right-0 z-10 p-2"
      />
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute top-0 left-0 z-10 p-2">
          <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md backdrop-blur-sm">
            Loading {loadingCount} widget{loadingCount !== 1 ? 's' : ''}...
          </div>
        </div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={onLayoutChange}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={60}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isDraggable={!isViewMode}
        isResizable={!isViewMode}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
      >
        {gridElements}
      </ResponsiveGridLayout>
    </div>
  );
}