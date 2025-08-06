import React from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useWidgetManager, WidgetLayout } from '@/contexts/WidgetManagerContext';
import { WidgetRenderer } from './WidgetRenderer';
import { WidgetWrapper } from './WidgetWrapper';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardCanvasProps {
  clientId: string;
  selectedVersion?: string;
}

export function DashboardCanvas({ clientId, selectedVersion }: DashboardCanvasProps) {
  const { widgets, layouts, updateLayout } = useWidgetManager();

  const handleLayoutChange = (layout: Layout[]) => {
    const updatedLayouts: WidgetLayout[] = layout.map(item => {
      const existingWidget = layouts.find(l => l.i === item.i);
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
    updateLayout(updatedLayouts);
  };

  const gridLayouts = layouts.map(layout => ({
    i: layout.i,
    x: layout.x,
    y: layout.y,
    w: layout.w,
    h: layout.h,
  }));

  return (
    <div className="p-4 min-h-screen bg-background">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: gridLayouts }}
        onLayoutChange={handleLayoutChange}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isDraggable
        isResizable
        useCSSTransforms
      >
        {widgets.map(widget => (
          <div key={widget.id} className="bg-card border rounded-lg shadow-sm">
            <WidgetWrapper widget={widget}>
              <WidgetRenderer widget={{ ...widget, config: { ...widget.config, clientId, selectedVersion } }} />
            </WidgetWrapper>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}