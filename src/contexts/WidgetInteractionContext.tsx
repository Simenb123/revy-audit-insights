import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

export interface WidgetEvent {
  id: string;
  sourceWidgetId: string;
  eventType: string;
  timestamp: number;
  data: any;
  metadata?: Record<string, any>;
}

export interface WidgetFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: any;
  sourceWidgetId: string;
}

export interface WidgetInteraction {
  sourceWidgetId: string;
  targetWidgetId: string;
  interactionType: 'filter' | 'drill-down' | 'data-sync' | 'navigation';
  config?: Record<string, any>;
}

interface WidgetInteractionState {
  events: WidgetEvent[];
  filters: Record<string, WidgetFilter[]>; // targetWidgetId -> filters
  interactions: WidgetInteraction[];
  activeFilters: Record<string, WidgetFilter[]>;
  selectedItems: Record<string, any[]>; // widgetId -> selected items
}

type WidgetInteractionAction =
  | { type: 'EMIT_EVENT'; payload: Omit<WidgetEvent, 'id' | 'timestamp'> }
  | { type: 'ADD_FILTER'; payload: { targetWidgetId: string; filter: WidgetFilter } }
  | { type: 'REMOVE_FILTER'; payload: { targetWidgetId: string; filterId: string } }
  | { type: 'CLEAR_FILTERS'; payload: { targetWidgetId?: string } }
  | { type: 'ADD_INTERACTION'; payload: WidgetInteraction }
  | { type: 'REMOVE_INTERACTION'; payload: { sourceWidgetId: string; targetWidgetId: string } }
  | { type: 'SET_SELECTED_ITEMS'; payload: { widgetId: string; items: any[] } }
  | { type: 'CLEAR_EVENTS'; payload?: { maxAge?: number } };

const initialState: WidgetInteractionState = {
  events: [],
  filters: {},
  interactions: [],
  activeFilters: {},
  selectedItems: {}
};

function widgetInteractionReducer(
  state: WidgetInteractionState, 
  action: WidgetInteractionAction
): WidgetInteractionState {
  switch (action.type) {
    case 'EMIT_EVENT': {
      const event: WidgetEvent = {
        ...action.payload,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      
      return {
        ...state,
        events: [...state.events.slice(-99), event] // Keep last 100 events
      };
    }

    case 'ADD_FILTER': {
      const { targetWidgetId, filter } = action.payload;
      const existingFilters = state.filters[targetWidgetId] || [];
      
      // Remove existing filter for same field from same source
      const filteredExisting = existingFilters.filter(
        f => !(f.field === filter.field && f.sourceWidgetId === filter.sourceWidgetId)
      );
      
      return {
        ...state,
        filters: {
          ...state.filters,
          [targetWidgetId]: [...filteredExisting, filter]
        },
        activeFilters: {
          ...state.activeFilters,
          [targetWidgetId]: [...filteredExisting, filter]
        }
      };
    }

    case 'REMOVE_FILTER': {
      const { targetWidgetId, filterId } = action.payload;
      const filters = state.filters[targetWidgetId]?.filter(f => 
        `${f.sourceWidgetId}_${f.field}` !== filterId
      ) || [];
      
      return {
        ...state,
        filters: {
          ...state.filters,
          [targetWidgetId]: filters
        },
        activeFilters: {
          ...state.activeFilters,
          [targetWidgetId]: filters
        }
      };
    }

    case 'CLEAR_FILTERS': {
      const { targetWidgetId } = action.payload;
      
      if (targetWidgetId) {
        const { [targetWidgetId]: removed, ...restFilters } = state.filters;
        const { [targetWidgetId]: removedActive, ...restActiveFilters } = state.activeFilters;
        
        return {
          ...state,
          filters: restFilters,
          activeFilters: restActiveFilters
        };
      }
      
      return {
        ...state,
        filters: {},
        activeFilters: {}
      };
    }

    case 'ADD_INTERACTION': {
      const existingIndex = state.interactions.findIndex(
        i => i.sourceWidgetId === action.payload.sourceWidgetId && 
            i.targetWidgetId === action.payload.targetWidgetId
      );
      
      if (existingIndex >= 0) {
        const newInteractions = [...state.interactions];
        newInteractions[existingIndex] = action.payload;
        return { ...state, interactions: newInteractions };
      }
      
      return {
        ...state,
        interactions: [...state.interactions, action.payload]
      };
    }

    case 'REMOVE_INTERACTION': {
      return {
        ...state,
        interactions: state.interactions.filter(
          i => !(i.sourceWidgetId === action.payload.sourceWidgetId && 
                 i.targetWidgetId === action.payload.targetWidgetId)
        )
      };
    }

    case 'SET_SELECTED_ITEMS': {
      return {
        ...state,
        selectedItems: {
          ...state.selectedItems,
          [action.payload.widgetId]: action.payload.items
        }
      };
    }

    case 'CLEAR_EVENTS': {
      const maxAge = action.payload?.maxAge || 60 * 60 * 1000; // 1 hour default
      const cutoff = Date.now() - maxAge;
      
      return {
        ...state,
        events: state.events.filter(event => event.timestamp > cutoff)
      };
    }

    default:
      return state;
  }
}

interface WidgetInteractionContextType {
  state: WidgetInteractionState;
  emitEvent: (event: Omit<WidgetEvent, 'id' | 'timestamp'>) => void;
  addFilter: (targetWidgetId: string, filter: WidgetFilter) => void;
  removeFilter: (targetWidgetId: string, filterId: string) => void;
  clearFilters: (targetWidgetId?: string) => void;
  addInteraction: (interaction: WidgetInteraction) => void;
  removeInteraction: (sourceWidgetId: string, targetWidgetId: string) => void;
  setSelectedItems: (widgetId: string, items: any[]) => void;
  getFiltersForWidget: (widgetId: string) => WidgetFilter[];
  getInteractionsForWidget: (widgetId: string) => WidgetInteraction[];
  getSelectedItems: (widgetId: string) => any[];
}

const WidgetInteractionContext = createContext<WidgetInteractionContextType | undefined>(undefined);

export function WidgetInteractionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(widgetInteractionReducer, initialState);

  const emitEvent = useCallback((event: Omit<WidgetEvent, 'id' | 'timestamp'>) => {
    dispatch({ type: 'EMIT_EVENT', payload: event });
  }, []);

  const addFilter = useCallback((targetWidgetId: string, filter: WidgetFilter) => {
    dispatch({ type: 'ADD_FILTER', payload: { targetWidgetId, filter } });
    
    // Emit event for listeners
    emitEvent({
      sourceWidgetId: filter.sourceWidgetId,
      eventType: 'filter-applied',
      data: { targetWidgetId, filter }
    });
  }, [emitEvent]);

  const removeFilter = useCallback((targetWidgetId: string, filterId: string) => {
    dispatch({ type: 'REMOVE_FILTER', payload: { targetWidgetId, filterId } });
  }, []);

  const clearFilters = useCallback((targetWidgetId?: string) => {
    dispatch({ type: 'CLEAR_FILTERS', payload: { targetWidgetId } });
  }, []);

  const addInteraction = useCallback((interaction: WidgetInteraction) => {
    dispatch({ type: 'ADD_INTERACTION', payload: interaction });
  }, []);

  const removeInteraction = useCallback((sourceWidgetId: string, targetWidgetId: string) => {
    dispatch({ type: 'REMOVE_INTERACTION', payload: { sourceWidgetId, targetWidgetId } });
  }, []);

  const setSelectedItems = useCallback((widgetId: string, items: any[]) => {
    dispatch({ type: 'SET_SELECTED_ITEMS', payload: { widgetId, items } });
    
    emitEvent({
      sourceWidgetId: widgetId,
      eventType: 'selection-changed',
      data: { items, count: items.length }
    });
  }, [emitEvent]);

  const getFiltersForWidget = useCallback((widgetId: string) => {
    return state.activeFilters[widgetId] || [];
  }, [state.activeFilters]);

  const getInteractionsForWidget = useCallback((widgetId: string) => {
    return state.interactions.filter(
      i => i.sourceWidgetId === widgetId || i.targetWidgetId === widgetId
    );
  }, [state.interactions]);

  const getSelectedItems = useCallback((widgetId: string) => {
    return state.selectedItems[widgetId] || [];
  }, [state.selectedItems]);

  // Auto-cleanup old events
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CLEAR_EVENTS', payload: { maxAge: 60 * 60 * 1000 } });
    }, 5 * 60 * 1000); // Clean every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const contextValue: WidgetInteractionContextType = {
    state,
    emitEvent,
    addFilter,
    removeFilter,
    clearFilters,
    addInteraction,
    removeInteraction,
    setSelectedItems,
    getFiltersForWidget,
    getInteractionsForWidget,
    getSelectedItems
  };

  return (
    <WidgetInteractionContext.Provider value={contextValue}>
      {children}
    </WidgetInteractionContext.Provider>
  );
}

export function useWidgetInteraction() {
  const context = useContext(WidgetInteractionContext);
  if (context === undefined) {
    throw new Error('useWidgetInteraction must be used within a WidgetInteractionProvider');
  }
  return context;
}

// Hook for individual widget interaction
export function useWidgetInteractionHandler(widgetId: string) {
  const {
    emitEvent,
    addFilter,
    removeFilter,
    setSelectedItems,
    getFiltersForWidget,
    getSelectedItems
  } = useWidgetInteraction();

  const applyFilterToTarget = useCallback((
    targetWidgetId: string,
    field: string,
    operator: WidgetFilter['operator'],
    value: any
  ) => {
    addFilter(targetWidgetId, {
      field,
      operator,
      value,
      sourceWidgetId: widgetId
    });
  }, [addFilter, widgetId]);

  const handleSelection = useCallback((items: any[]) => {
    setSelectedItems(widgetId, items);
  }, [setSelectedItems, widgetId]);

  const emitCustomEvent = useCallback((eventType: string, data: any, metadata?: Record<string, any>) => {
    emitEvent({
      sourceWidgetId: widgetId,
      eventType,
      data,
      metadata
    });
  }, [emitEvent, widgetId]);

  return {
    widgetId,
    applyFilterToTarget,
    handleSelection,
    emitCustomEvent,
    activeFilters: getFiltersForWidget(widgetId),
    selectedItems: getSelectedItems(widgetId)
  };
}