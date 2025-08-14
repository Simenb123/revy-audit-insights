import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CrossFilterState {
  activeFilters: Record<string, any>;
  sourceWidget: string | null;
  timestamp: number;
}

export interface DashboardParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  value: any;
  options?: any[];
  required?: boolean;
}

interface DashboardInteractionsContextType {
  // Cross-filtering
  crossFilter: CrossFilterState;
  setCrossFilter: (sourceWidget: string, filters: Record<string, any>) => void;
  clearCrossFilter: () => void;
  
  // Dashboard parameters
  parameters: DashboardParameter[];
  setParameter: (id: string, value: any) => void;
  getParameter: (id: string) => any;
  addParameter: (parameter: DashboardParameter) => void;
  removeParameter: (id: string) => void;
  
  // Widget interactions
  selectedWidget: string | null;
  setSelectedWidget: (widgetId: string | null) => void;
  hoveredWidget: string | null;
  setHoveredWidget: (widgetId: string | null) => void;
  
  // Drill-down functionality
  drilldownStack: Array<{ widgetId: string; filters: Record<string, any>; timestamp: number }>;
  pushDrilldown: (widgetId: string, filters: Record<string, any>) => void;
  popDrilldown: () => void;
  clearDrilldown: () => void;
}

const DashboardInteractionsContext = createContext<DashboardInteractionsContextType | undefined>(undefined);

interface DashboardInteractionsProviderProps {
  children: ReactNode;
  initialParameters?: DashboardParameter[];
}

export function DashboardInteractionsProvider({ 
  children, 
  initialParameters = [] 
}: DashboardInteractionsProviderProps) {
  const [crossFilter, setCrossFilterState] = useState<CrossFilterState>({
    activeFilters: {},
    sourceWidget: null,
    timestamp: 0
  });
  
  const [parameters, setParameters] = useState<DashboardParameter[]>(initialParameters);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);
  const [drilldownStack, setDrilldownStack] = useState<Array<{ widgetId: string; filters: Record<string, any>; timestamp: number }>>([]);

  const setCrossFilter = useCallback((sourceWidget: string, filters: Record<string, any>) => {
    setCrossFilterState({
      activeFilters: filters,
      sourceWidget,
      timestamp: Date.now()
    });
  }, []);

  const clearCrossFilter = useCallback(() => {
    setCrossFilterState({
      activeFilters: {},
      sourceWidget: null,
      timestamp: Date.now()
    });
  }, []);

  const setParameter = useCallback((id: string, value: any) => {
    setParameters(prev => prev.map(p => p.id === id ? { ...p, value } : p));
  }, []);

  const getParameter = useCallback((id: string) => {
    return parameters.find(p => p.id === id)?.value;
  }, [parameters]);

  const addParameter = useCallback((parameter: DashboardParameter) => {
    setParameters(prev => [...prev.filter(p => p.id !== parameter.id), parameter]);
  }, []);

  const removeParameter = useCallback((id: string) => {
    setParameters(prev => prev.filter(p => p.id !== id));
  }, []);

  const pushDrilldown = useCallback((widgetId: string, filters: Record<string, any>) => {
    setDrilldownStack(prev => [...prev, { widgetId, filters, timestamp: Date.now() }]);
  }, []);

  const popDrilldown = useCallback(() => {
    setDrilldownStack(prev => prev.slice(0, -1));
  }, []);

  const clearDrilldown = useCallback(() => {
    setDrilldownStack([]);
  }, []);

  const value = {
    crossFilter,
    setCrossFilter,
    clearCrossFilter,
    parameters,
    setParameter,
    getParameter,
    addParameter,
    removeParameter,
    selectedWidget,
    setSelectedWidget,
    hoveredWidget,
    setHoveredWidget,
    drilldownStack,
    pushDrilldown,
    popDrilldown,
    clearDrilldown
  };

  return (
    <DashboardInteractionsContext.Provider value={value}>
      {children}
    </DashboardInteractionsContext.Provider>
  );
}

export function useDashboardInteractions() {
  const context = useContext(DashboardInteractionsContext);
  if (!context) {
    throw new Error('useDashboardInteractions must be used within DashboardInteractionsProvider');
  }
  return context;
}

// Hook for widgets to subscribe to cross-filter changes
export function useCrossFilter(widgetId: string) {
  const { crossFilter } = useDashboardInteractions();
  
  const isFiltered = crossFilter.sourceWidget !== null && crossFilter.sourceWidget !== widgetId;
  const activeFilters = isFiltered ? crossFilter.activeFilters : {};
  
  return {
    isFiltered,
    activeFilters,
    sourceWidget: crossFilter.sourceWidget,
    timestamp: crossFilter.timestamp
  };
}

// Hook for widgets to subscribe to parameter changes
export function useWidgetParameters(parameterIds: string[]) {
  const { parameters, getParameter } = useDashboardInteractions();
  
  const relevantParameters = parameters.filter(p => parameterIds.includes(p.id));
  const parameterValues = Object.fromEntries(
    parameterIds.map(id => [id, getParameter(id)])
  );
  
  return {
    parameters: relevantParameters,
    values: parameterValues
  };
}