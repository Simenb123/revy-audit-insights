import React from 'react';
import { Responsive, WidthProvider, Layout, ItemCallback } from 'react-grid-layout';
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

  const handleLayoutChange = (layout: Layout[]) => {
    const updatedLayouts: WidgetLayout[] = layout.map(item => {
      const existingWidget = layouts.find(l => l.i === item.i);
      return {
        i: item.i,
        x: Math.round(item.x),
        y: Math.round(item.y),
        w: Math.round(item.w),
        h: Math.round(item.h),
        widgetId: existingWidget?.widgetId || item.i,
        dataSourceId: existingWidget?.dataSourceId,
      };
    });
    updateLayout(updatedLayouts);
  };

  const handleDragOrResizeStop: ItemCallback = layout => {
    handleLayoutChange(layout);
  };

  const gridLayouts = layouts.map(layout => ({
    i: layout.i,
    x: layout.x,
    y: layout.y,
    w: layout.w,
    h: layout.h,
  }));

  const gridStyle = !isViewMode
    ? {
        backgroundImage:
          `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
           linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`,
        backgroundSize: `calc(100% / 12) ${GRID_ROW_HEIGHT + GRID_MARGIN[1]}px`,
      }
    : undefined;

  return (
    <div
      className={cn(
        "p-4 min-h-screen bg-background",
        isViewMode && "print:p-0 print:min-h-0 print:bg-white"
      )}
    >
      <ResponsiveGridLayout
        className={cn("layout", isViewMode && "print:static")}
        style={gridStyle}
        layouts={{ lg: gridLayouts }}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragOrResizeStop}
        onResizeStop={handleDragOrResizeStop}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={GRID_ROW_HEIGHT}
        margin={GRID_MARGIN}
        containerPadding={[0, 0]}
        isDraggable={!isViewMode}
        isResizable={!isViewMode}
        useCSSTransforms
        compactType="vertical"
        preventCollision={false}
        draggableCancel=".widget-controls"
      >
        {widgets.map(widget => (
          <WidgetWrapper key={widget.id} widget={widget}>
            <WidgetRenderer
              widget={{
                ...widget,
                config: { ...widget.config, clientId, selectedVersion },
              }}
            />
          </WidgetWrapper>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}