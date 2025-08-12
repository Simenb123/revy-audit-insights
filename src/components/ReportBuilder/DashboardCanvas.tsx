import React from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useWidgetManager, WidgetLayout, LayoutsByBreakpoint, Breakpoint } from '@/contexts/WidgetManagerContext';
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
  device: Breakpoint;
}

export function DashboardCanvas({ clientId, selectedVersion, device }: DashboardCanvasProps) {
  const { widgets, layouts, updateLayout } = useWidgetManager();
  const { isViewMode } = useViewMode();

  const handleLayoutChange = (layout: Layout[]) => {
    const updatedLayouts: WidgetLayout[] = layout.map(item => {
      const existingWidget = layouts[device].find(l => l.i === item.i);
      return {
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        widgetId: existingWidget?.widgetId || item.i,
        dataSourceId: existingWidget?.dataSourceId,
      };
    });
    updateLayout(device, updatedLayouts);
  };

  const gridLayouts: LayoutsByBreakpoint = {
    lg: layouts.lg.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })),
    md: layouts.md.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })),
    sm: layouts.sm.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })),
    xs: layouts.xs.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })),
  };

  return (
    <div
      className={cn(
        "p-4 min-h-screen bg-background",
        isViewMode && "print:p-0 print:min-h-0 print:bg-white",
        device === 'md' && 'max-w-[768px] mx-auto',
        device === 'sm' && 'max-w-[480px] mx-auto'
      )}
    >
      <ResponsiveGridLayout
        key={device}
        className={cn(
          "layout",
          isViewMode && "print:static"
        )}
        layouts={gridLayouts}
        onLayoutChange={handleLayoutChange}
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
          <div
            key={widget.id}
            className={cn(
              "bg-card border rounded-lg shadow-sm",
              isViewMode && "print:shadow-none print:border-gray-300"
            )}
          >
            <WidgetWrapper widget={widget} breakpoint={device}>
              <WidgetRenderer widget={{ ...widget, config: { ...widget.config, clientId, selectedVersion } }} />
            </WidgetWrapper>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}