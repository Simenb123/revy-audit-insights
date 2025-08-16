import React, { createContext, useContext, useState, useCallback, useEffect, memo } from 'react';
import { useWidgetPersistence } from '@/hooks/useWidgetPersistence';
import { useValidatedState } from '@/hooks/useValidatedState';
import { widgetCacheManager } from '@/services/widgetCacheManager';
import { WidgetSchema, WidgetLayoutSchema, validateWidget, validateWidgetLayout } from '@/types/widget';
import { logger } from '@/utils/logger';

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
    | 'map'
    | 'waterfall'
    | 'enhancedKpi'
    | 'metricCard'
    | 'progress'
    | 'activityFeed'
    | 'alerts'
    | 'accountHierarchy'
    | 'metricsExplorer'
    | 'smartNavigation'
    | 'crossCheck';
  title: string;
  config?: Record<string, any>;
  sectionId?: string;
  dataSourceId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
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
  activeCrossFilter?: {
    sourceWidgetId: string;
    filterType: string;
    value: any;
    label: string;
  };
  setActiveCrossFilter: (
    filter?: {
      sourceWidgetId: string;
      filterType: string;
      value: any;
      label: string;
    }
  ) => void;
}

export const WidgetManagerContext = createContext<WidgetManagerContextType | undefined>(undefined);

export const WidgetManagerProvider = memo(function WidgetManagerProvider({
  children,
  clientId,
  year,
}: {
  children: React.ReactNode;
  clientId: string;
  year: number;
}) {
  // Use standard state - validation will be done at runtime
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layouts, setLayouts] = useState<WidgetLayout[]>([]);

  const [activeCrossFilter, setActiveCrossFilter] = useState<
    {
      sourceWidgetId: string;
      filterType: string;
      value: any;
      label: string;
    } | undefined
  >(undefined);
  const { load, save, clear } = useWidgetPersistence(clientId, year);

  const addWidget = useCallback((widget: Widget, layout: WidgetLayout) => {
    try {
      // Cache the widget
      widgetCacheManager.setWidget(widget);
      
      setWidgets(prev => [...prev, widget]);
      setLayouts(prev => [...prev, layout]);
      logger.debug('Widget added:', widget.id);
    } catch (error) {
      logger.error('Failed to add widget:', error);
      throw new Error(`Invalid widget data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    // Invalidate cache
    widgetCacheManager.invalidateWidget(widgetId);
    
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setLayouts(prev => prev.filter(l => l.widgetId !== widgetId));
    logger.debug('Widget removed:', widgetId);
  }, []);

  const updateLayout = useCallback((newLayouts: WidgetLayout[]) => {
    setLayouts(newLayouts);
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<Widget>) => {
    try {
      setWidgets(prev => prev.map(w => {
        if (w.id === widgetId) {
          const updatedWidget = { ...w, ...updates };
          
          // Update cache
          widgetCacheManager.setWidget(updatedWidget);
          
          return updatedWidget;
        }
        return w;
      }));
      
      if (Object.prototype.hasOwnProperty.call(updates, 'sectionId')) {
        setLayouts(prev => prev.map(l => l.widgetId === widgetId ? { ...l, sectionId: updates.sectionId } : l));
      }
      
      logger.debug('Widget updated:', widgetId);
    } catch (error) {
      logger.error('Failed to update widget:', error);
      throw new Error(`Invalid widget update: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  useEffect(() => {
    if (activeCrossFilter) {
      console.debug('Aktivt kryssfilter', activeCrossFilter);
    }
  }, [activeCrossFilter]);

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
      activeCrossFilter,
      setActiveCrossFilter,
    }}>
      {children}
    </WidgetManagerContext.Provider>
  );
});

export function useWidgetManager() {
  const context = useContext(WidgetManagerContext);
  if (!context) {
    throw new Error('useWidgetManager must be used within a WidgetManagerProvider');
  }
  return context;
}