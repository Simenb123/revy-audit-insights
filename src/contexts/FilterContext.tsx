import React, { createContext, useContext, useState, useCallback } from 'react';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { useToast } from '@/hooks/use-toast';

export interface FilterState {
  dateRange?: {
    start?: string;
    end?: string;
  };
  accountCategory?: string;
  accountType?: string;
  searchTerm?: string;
  // Cross-filtering from widget interactions
  crossFilter?: {
    sourceWidgetId: string;
    filterType: 'category' | 'account' | 'amount_range';
    value: any;
    label: string;
  };
}

interface FilterContextType {
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: any) => void;
  clearFilters: () => void;
  clearFilter: (key: keyof FilterState) => void;
  // Cross-filtering methods
  setCrossFilter: (sourceWidgetId: string, filterType: string, value: any, label: string) => void;
  clearCrossFilter: () => void;
  isCrossFiltered: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({});
  const { setActiveCrossFilter } = useWidgetManager();
  const { toast } = useToast();

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const clearFilter = useCallback((key: keyof FilterState) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const setCrossFilter = useCallback(
    (sourceWidgetId: string, filterType: string, value: any, label: string) => {
      setFilters(prev => ({
        ...prev,
        crossFilter: {
          sourceWidgetId,
          filterType: filterType as 'category' | 'account' | 'amount_range',
          value,
          label,
        },
      }));
      setActiveCrossFilter({ sourceWidgetId, filterType, value, label });
      if (typeof window !== 'undefined' && !localStorage.getItem('crossFilterTooltipShown')) {
        toast({
          title: 'Kryssfilter aktivert',
          description: 'Widgets med markering viser nå filtrerte tall. Klikk på filteret for å fjerne.',
        });
        localStorage.setItem('crossFilterTooltipShown', 'true');
      }
    },
    [setActiveCrossFilter, toast]
  );

  const clearCrossFilter = useCallback(() => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters.crossFilter;
      return newFilters;
    });
    setActiveCrossFilter(undefined);
  }, [setActiveCrossFilter]);

  const isCrossFiltered = Boolean(filters.crossFilter);

  return (
    <FilterContext.Provider value={{
      filters,
      updateFilter,
      clearFilters,
      clearFilter,
      setCrossFilter,
      clearCrossFilter,
      isCrossFiltered,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}