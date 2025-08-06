import React, { createContext, useContext, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface ClassificationContextType {
  invalidateWidgetData: (clientId: string, fiscalYear?: number, selectedVersion?: string) => void;
}

const ClassificationContext = createContext<ClassificationContextType | undefined>(undefined);

export function ClassificationProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const invalidateWidgetData = useCallback(
    (clientId: string, fiscalYear?: number, selectedVersion?: string) => {
      // Invalidate trial balance data that widgets depend on
      queryClient.invalidateQueries({
        queryKey: ['trial-balance-with-mappings', clientId, fiscalYear, selectedVersion],
      });
      
      // Invalidate related data queries
      queryClient.invalidateQueries({
        queryKey: ['account-classifications', clientId],
      });
      
      // Invalidate any other data that might be affected by classifications
      queryClient.invalidateQueries({
        queryKey: ['standard-account-balances', clientId],
      });
    },
    [queryClient]
  );

  return (
    <ClassificationContext.Provider value={{ invalidateWidgetData }}>
      {children}
    </ClassificationContext.Provider>
  );
}

export function useClassificationUpdates() {
  const context = useContext(ClassificationContext);
  if (!context) {
    throw new Error('useClassificationUpdates must be used within a ClassificationProvider');
  }
  return context;
}