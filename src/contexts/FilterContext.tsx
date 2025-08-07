import React, { createContext, useContext, useState, useCallback } from 'react';

export interface FilterState {
  dateRange?: {
    start?: string;
    end?: string;
  };
  accountCategory?: string;
  accountType?: string;
  searchTerm?: string;
}

interface FilterContextType {
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: any) => void;
  clearFilters: () => void;
  clearFilter: (key: keyof FilterState) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({});

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

  return (
    <FilterContext.Provider value={{
      filters,
      updateFilter,
      clearFilters,
      clearFilter,
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