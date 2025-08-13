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
  sectionId?: string;
}

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
    | 'budgetChart'
    | 'heatmap'
    | 'treemap'
    | 'bubble'
    | 'enhancedKpi';
  title: string;
  config?: Record<string, any>;
  sectionId?: string;
}

interface WidgetManagerContextType {
  widgets: Widget[];
  layouts: WidgetLayout[];
  addWidget: (widget: Widget, layout: WidgetLayout) => void;
  removeWidget: (widgetId: string) => void;
  updateLayout: (layouts: WidgetLayout[]) => void;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  clearWidgets: () => void;
  setWidgets: (widgets: Widget[]) => void;
  setLayouts: (layouts: WidgetLayout[]) => void;
  loadFromStorage: () => boolean;
}

export const WidgetManagerContext = createContext<WidgetManagerContextType | undefined>(undefined);

export function WidgetManagerProvider({ children }: { children: React.ReactNode }) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layouts, setLayouts] = useState<WidgetLayout[]>([]);
  const { load, save, clear } = useWidgetPersistence();

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
    if (Object.prototype.hasOwnProperty.call(updates, 'sectionId')) {
      setLayouts(prev => prev.map(l => l.widgetId === widgetId ? { ...l, sectionId: updates.sectionId } : l));
    }
  }, []);

  const clearWidgets = useCallback(() => {
    setWidgets([]);
    setLayouts([]);
    clear();
  }, [clear]);

  const loadFromStorage = useCallback(() => {
    const state = load();
    if (state) {
      setWidgets(state.widgets);
      setLayouts(state.layouts);
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