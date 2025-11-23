import React, { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { useOptimizedAnalysis } from '@/hooks/useOptimizedAnalysis';
import { useActiveVersion } from '@/hooks/useAccountingVersions';
import type { OptimizedAnalysisResult } from '@/types/optimizedAnalysis';

interface AnalysisContextType {
  analysis: OptimizedAnalysisResult | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  lastUpdated: string | null;
  // Shared filter/view states
  selectedAccounts: string[];
  setSelectedAccounts: (accounts: string[]) => void;
  viewMode: 'compact' | 'detailed';
  setViewMode: (mode: 'compact' | 'detailed') => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

interface AnalysisProviderProps {
  children: ReactNode;
  clientId: string;
}

export function AnalysisProvider({ children, clientId }: AnalysisProviderProps) {
  const { data: activeVersion } = useActiveVersion(clientId);
  
  // Shared state for filters and views
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed');
  
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
      staleTime: 2 * 60 * 1000, // 2 minutes
      // Prevent refetch on window focus to reduce unnecessary API calls
      refetchOnWindowFocus: false
    }
  );

  const lastUpdated = useMemo(() => 
    analysis?.metadata?.generated_at 
      ? new Date(analysis.metadata.generated_at).toLocaleString('no-NO', {
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : null,
    [analysis?.metadata?.generated_at]
  );

  const contextValue = useMemo(() => ({
    analysis: analysis ?? null, 
    isLoading, 
    error: error as Error | null, 
    refetch,
    lastUpdated,
    selectedAccounts,
    setSelectedAccounts,
    viewMode,
    setViewMode
  }), [
    analysis, 
    isLoading, 
    error, 
    refetch, 
    lastUpdated,
    selectedAccounts,
    viewMode
  ]);

  return (
    <AnalysisContext.Provider value={contextValue}>
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