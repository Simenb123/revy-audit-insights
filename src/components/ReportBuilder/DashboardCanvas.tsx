import React, { useRef, useState, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useWidgetManager, WidgetLayout } from '@/contexts/WidgetManagerContext';
import { WidgetRenderer } from './WidgetRenderer';
import { WidgetWrapper } from './WidgetWrapper';
import { useViewMode } from './ViewModeContext';
import { cn } from '@/lib/utils';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { GRID_ROW_HEIGHT, GRID_MARGIN } from '@/components/ReportBuilder/gridConfig';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardCanvasProps {
  clientId: string;
  selectedVersion?: string;
}

export function DashboardCanvas({ clientId, selectedVersion }: DashboardCanvasProps) {
  const { widgets, layouts, updateLayout } = useWidgetManager();
  const { isViewMode } = useViewMode();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});

  const convertLayout = useCallback((layout: Layout[], movingItem?: Layout): WidgetLayout[] => {
    let updatedLayouts: WidgetLayout[] = layout.map(item => {
      const existingWidget = layouts.find(l => l.i === item.i);
      const widget = widgets.find(w => w.id === (existingWidget?.widgetId || item.i));
      return {
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        widgetId: existingWidget?.widgetId || item.i,
        dataSourceId: existingWidget?.dataSourceId,
        groupId: widget?.groupId || existingWidget?.groupId,
      };
    });

    if (movingItem) {
      const prev = layouts.find(l => l.i === movingItem.i);
      const widget = widgets.find(w => w.id === (prev?.widgetId || movingItem.i));
      const groupId = widget?.groupId || prev?.groupId;
      if (groupId && prev) {
        const dx = movingItem.x - prev.x;
        const dy = movingItem.y - prev.y;
        const dw = movingItem.w - prev.w;
        const dh = movingItem.h - prev.h;
        if (dx || dy || dw || dh) {
          updatedLayouts = updatedLayouts.map(l => {
            if (l.i !== movingItem.i) {
              const w = widgets.find(w => w.id === l.widgetId);
              if (w?.groupId === groupId) {
                return { ...l, x: l.x + dx, y: l.y + dy, w: l.w + dw, h: l.h + dh };
              }
            }
            return l;
          });
        }
      }
    }

    return updatedLayouts;
  }, [layouts, widgets]);

  const updateGuides = (item: Layout) => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    const cols = 12;
    const colWidth = (width - GRID_MARGIN[0] * (cols + 1)) / cols;
    const x = GRID_MARGIN[0] + item.x * (colWidth + GRID_MARGIN[0]);
    const y = GRID_MARGIN[1] + item.y * (GRID_ROW_HEIGHT + GRID_MARGIN[1]);
    setGuides({ x, y });
  };

  const handleDrag = (layout: Layout[], oldItem: Layout, newItem: Layout) => {
    updateGuides(newItem);
    updateLayout(convertLayout(layout, newItem));
  };

  const handleResize = (layout: Layout[], oldItem: Layout, newItem: Layout) => {
    updateGuides(newItem);
    updateLayout(convertLayout(layout, newItem));
  };

  const handleDragStop = () => setGuides({});
  const handleResizeStop = () => setGuides({});

  const handleLayoutChange = (layout: Layout[]) => {
    updateLayout(convertLayout(layout));
  };

  const gridLayouts = layouts.map(layout => ({
    i: layout.i,
    x: layout.x,
    y: layout.y,
    w: layout.w,
    h: layout.h,
  }));

  return (
    <div ref={containerRef} className={cn(
      "relative p-4 min-h-screen bg-background",
      isViewMode && "print:p-0 print:min-h-0 print:bg-white"
    )}>
      {guides.x !== undefined && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none"
          style={{ left: guides.x }}
        />
      )}
      {guides.y !== undefined && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-primary pointer-events-none"
          style={{ top: guides.y }}
        />
      )}
      <ResponsiveGridLayout
        className={cn(
          "layout",
          isViewMode && "print:static"
        )}
        layouts={{ lg: gridLayouts }}
        onLayoutChange={handleLayoutChange}
        onDrag={handleDrag}
        onResize={handleResize}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={GRID_ROW_HEIGHT}
        margin={GRID_MARGIN}
        containerPadding={[0, 0]}
        isDraggable={!isViewMode}
        isResizable={!isViewMode}
        useCSSTransforms
        compactType="vertical"
        preventCollision={false}
        draggableCancel=".widget-controls,.module-controls"
      >
        {widgets.map(widget => (
          <div key={widget.id} className={cn(
            "bg-card border rounded-lg shadow-sm",
            isViewMode && "print:shadow-none print:border-gray-300"
          )}>
            <WidgetWrapper widget={widget}>
              <WidgetRenderer widget={{ ...widget, config: { ...widget.config, clientId, selectedVersion } }} />
            </WidgetWrapper>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}