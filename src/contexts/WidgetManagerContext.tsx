import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWidgetPersistence } from '@/hooks/useWidgetPersistence';

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  widgetId: string;
  dataSourceId?: string;
}

export type Breakpoint = 'lg' | 'md' | 'sm' | 'xs';

export type LayoutsByBreakpoint = Record<Breakpoint, WidgetLayout[]>;

export interface Widget {
  id: string;
  type:
    | 'kpi'
    | 'table'
    | 'chart'
    | 'text'
    | 'formula'
    | 'filter'
    | 'pivot'
    | 'gauge'
    | 'accountLines'
    | 'statementTable'
    | 'budgetKpi'
    | 'budgetTable'
    | 'budgetChart';
  title: string;
  config?: Record<string, any>;
}

interface WidgetManagerContextType {
  widgets: Widget[];
  layouts: LayoutsByBreakpoint;
  addWidget: (widget: Widget, layout: WidgetLayout) => void;
  removeWidget: (widgetId: string) => void;
  updateLayout: (breakpoint: Breakpoint, layouts: WidgetLayout[]) => void;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  clearWidgets: () => void;
  setWidgets: (widgets: Widget[]) => void;
  setLayouts: (layouts: LayoutsByBreakpoint) => void;
  loadFromStorage: () => boolean;
}

export const WidgetManagerContext = createContext<WidgetManagerContextType | undefined>(undefined);

export function WidgetManagerProvider({ children }: { children: React.ReactNode }) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layouts, setLayouts] = useState<LayoutsByBreakpoint>({
    lg: [],
    md: [],
    sm: [],
    xs: [],
  });
  const { load, save, clear } = useWidgetPersistence();

  const addWidget = useCallback((widget: Widget, layout: WidgetLayout) => {
    setWidgets(prev => [...prev, widget]);
    setLayouts(prev => ({
      lg: [...prev.lg, layout],
      md: [...prev.md, layout],
      sm: [...prev.sm, layout],
      xs: [...prev.xs, layout],
    }));
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setLayouts(prev => ({
      lg: prev.lg.filter(l => l.widgetId !== widgetId),
      md: prev.md.filter(l => l.widgetId !== widgetId),
      sm: prev.sm.filter(l => l.widgetId !== widgetId),
      xs: prev.xs.filter(l => l.widgetId !== widgetId),
    }));
  }, []);

  const updateLayout = useCallback((breakpoint: Breakpoint, newLayouts: WidgetLayout[]) => {
    setLayouts(prev => ({ ...prev, [breakpoint]: newLayouts }));
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<Widget>) => {
    setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, ...updates } : w));
  }, []);

  const clearWidgets = useCallback(() => {
    setWidgets([]);
    setLayouts({ lg: [], md: [], sm: [], xs: [] });
    clear();
  }, [clear]);

  const loadFromStorage = useCallback(() => {
    const state = load();
    if (state) {
      setWidgets(state.widgets);
      setLayouts(state.layouts as LayoutsByBreakpoint);
      return true;
    }
    return false;
  }, [load]);

  useEffect(() => {
    save(widgets, layouts);
  }, [widgets, layouts, save]);

  return (
    <WidgetManagerContext.Provider value={{
      widgets,
      layouts,
      addWidget,
      removeWidget,
      updateLayout,
      updateWidget,
      clearWidgets,
      setWidgets,
      setLayouts,
      loadFromStorage,
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