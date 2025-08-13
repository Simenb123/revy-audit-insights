import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { loadReportBuilderSettings, saveReportBuilderSettings } from '@/hooks/useReportBuilderSettings';

export type ScopeType = 'client' | 'firm';

interface ScopeContextValue {
  scopeType: ScopeType;
  setScopeType: (t: ScopeType) => void;
}

const ScopeContext = createContext<ScopeContextValue | undefined>(undefined);

interface ScopeProviderProps {
  children: React.ReactNode;
  clientId: string;
  fiscalYear: number;
}

export function ScopeProvider({ children, clientId, fiscalYear }: ScopeProviderProps) {
  const storageKeyInputs = useMemo(() => ({ clientId, fiscalYear }), [clientId, fiscalYear]);
  const [scopeType, setScopeTypeState] = useState<ScopeType>('client');

  // Load persisted settings
  useEffect(() => {
    const settings = loadReportBuilderSettings(storageKeyInputs.clientId, storageKeyInputs.fiscalYear);
    if (settings && (settings as any).scopeType) {
      setScopeTypeState((settings as any).scopeType as ScopeType);
    }
  }, [storageKeyInputs]);

  // Persist when scope changes
  useEffect(() => {
    const existing = loadReportBuilderSettings(storageKeyInputs.clientId, storageKeyInputs.fiscalYear) || {};
    saveReportBuilderSettings(storageKeyInputs.clientId, storageKeyInputs.fiscalYear, {
      ...existing,
      scopeType,
    });
  }, [scopeType, storageKeyInputs]);

  const setScopeType = useCallback((t: ScopeType) => setScopeTypeState(t), []);

  const value = useMemo(() => ({ scopeType, setScopeType }), [scopeType, setScopeType]);

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useScope() {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error('useScope must be used within a ScopeProvider');
  return ctx;
}
