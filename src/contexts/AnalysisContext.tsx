import React, { createContext, useContext, ReactNode } from 'react';
import { useOptimizedAnalysis } from '@/hooks/useOptimizedAnalysis';
import type { OptimizedAnalysisResult } from '@/types/optimizedAnalysis';

interface AnalysisContextType {
  analysis: OptimizedAnalysisResult | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

interface AnalysisProviderProps {
  children: ReactNode;
  clientId: string;
  datasetId?: string;
}

export function AnalysisProvider({ children, clientId, datasetId }: AnalysisProviderProps) {
  const { 
    data: analysis, 
    isLoading, 
    error, 
    refetch 
  } = useOptimizedAnalysis(
    { 
      clientId,
      datasetId 
    },
    { 
      enabled: !!clientId && !!datasetId,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  return (
    <AnalysisContext.Provider value={{ 
      analysis: analysis ?? null, 
      isLoading, 
      error: error as Error | null, 
      refetch 
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisContext() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysisContext must be used within an AnalysisProvider');
  }
  return context;
}