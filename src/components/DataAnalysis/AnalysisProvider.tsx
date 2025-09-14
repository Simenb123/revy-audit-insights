import React, { createContext, useContext, ReactNode } from 'react';
import { useOptimizedAnalysis } from '@/hooks/useOptimizedAnalysis';
import { useActiveVersion } from '@/hooks/useAccountingVersions';
import type { OptimizedAnalysisResult } from '@/types/optimizedAnalysis';

interface AnalysisContextType {
  analysis: OptimizedAnalysisResult | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  lastUpdated: string | null;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

interface AnalysisProviderProps {
  children: ReactNode;
  clientId: string;
}

export function AnalysisProvider({ children, clientId }: AnalysisProviderProps) {
  const { data: activeVersion } = useActiveVersion(clientId);
  
  const { 
    data: analysis, 
    isLoading, 
    error, 
    refetch 
  } = useOptimizedAnalysis(
    { 
      clientId,
      datasetId: activeVersion?.id 
    },
    { 
      enabled: !!activeVersion?.id,
      staleTime: 2 * 60 * 1000 // 2 minutes
    }
  );

  const lastUpdated = analysis?.metadata?.generated_at 
    ? new Date(analysis.metadata.generated_at).toLocaleString('no-NO', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <AnalysisContext.Provider value={{ 
      analysis: analysis ?? null, 
      isLoading, 
      error: error as Error | null, 
      refetch,
      lastUpdated
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