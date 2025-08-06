import React, { createContext, useContext, useState, useCallback } from 'react';

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  widgetId: string;
  dataSourceId?: string;
}

export interface Widget {
  id: string;
  type: 'kpi' | 'table' | 'chart' | 'text' | 'formula';
  title: string;
  config?: Record<string, any>;
}

interface WidgetManagerContextType {
  widgets: Widget[];
  layouts: WidgetLayout[];
  addWidget: (widget: Widget, layout: WidgetLayout) => void;
  removeWidget: (widgetId: string) => void;
  updateLayout: (layouts: WidgetLayout[]) => void;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
}

const WidgetManagerContext = createContext<WidgetManagerContextType | undefined>(undefined);

export function WidgetManagerProvider({ children }: { children: React.ReactNode }) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layouts, setLayouts] = useState<WidgetLayout[]>([]);

  const addWidget = useCallback((widget: Widget, layout: WidgetLayout) => {
    setWidgets(prev => [...prev, widget]);
    setLayouts(prev => [...prev, layout]);
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setLayouts(prev => prev.filter(l => l.widgetId !== widgetId));
  }, []);

  const updateLayout = useCallback((newLayouts: WidgetLayout[]) => {
    setLayouts(newLayouts);
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<Widget>) => {
    setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, ...updates } : w));
  }, []);

  return (
    <WidgetManagerContext.Provider value={{
      widgets,
      layouts,
      addWidget,
      removeWidget,
      updateLayout,
      updateWidget,
    }}>
      {children}
    </WidgetManagerContext.Provider>
  );
}

export function useWidgetManager() {
  const context = useContext(WidgetManagerContext);
  if (!context) {
    throw new Error('useWidgetManager must be used within a WidgetManagerProvider');
  }
  return context;
}