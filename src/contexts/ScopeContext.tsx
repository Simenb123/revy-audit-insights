import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { loadReportBuilderSettings, saveReportBuilderSettings } from '@/hooks/useReportBuilderSettings';
import { useClientList } from '@/hooks/useClientList';

export type ScopeType = 'client' | 'firm' | 'custom';

interface ScopeContextValue {
  scopeType: ScopeType;
  setScopeType: (t: ScopeType) => void;
  selectedClientIds: string[];
  setSelectedClientIds: (ids: string[]) => void;
}

const ScopeContext = createContext<ScopeContextValue | undefined>(undefined);

interface ScopeProviderProps {
  children: React.ReactNode;
  clientId: string;
  fiscalYear: number;
}

export function ScopeProvider({ children, clientId, fiscalYear }: ScopeProviderProps) {
  const storageKeyInputs = useMemo(() => ({ clientId, fiscalYear }), [clientId, fiscalYear]);
  const isGlobal = clientId === 'global';
  const [scopeType, setScopeTypeState] = useState<ScopeType>(isGlobal ? 'custom' : 'client');
  const [selectedClientIds, setSelectedClientIdsState] = useState<string[]>(isGlobal ? [] : (clientId ? [clientId] : []));
  const { data: firmClients = [] } = useClientList();

  // Load persisted settings
  useEffect(() => {
    const settings = loadReportBuilderSettings(storageKeyInputs.clientId, storageKeyInputs.fiscalYear);
    if (settings) {
      if ((settings as any).scopeType) {
        setScopeTypeState((settings as any).scopeType as ScopeType);
      }
      if ((settings as any).selectedClientIds) {
        setSelectedClientIdsState((settings as any).selectedClientIds as string[]);
      } else if (clientId && clientId !== 'global') {
        setSelectedClientIdsState([clientId]);
      }
    }
  }, [storageKeyInputs, clientId]);

  // Auto-select all firm clients in global 'firm' scope
  useEffect(() => {
    if (!isGlobal) return;
    if (scopeType !== 'firm') return;
    const allIds = (firmClients || []).map((c: any) => c.id).filter(Boolean);
    if (!allIds.length) return;
    const hasSame = selectedClientIds.length === allIds.length && selectedClientIds.every(id => allIds.includes(id));
    if (!hasSame) {
      setSelectedClientIdsState(allIds);
    }
  }, [isGlobal, scopeType, firmClients, selectedClientIds]);

  // Persist when scope or selection changes
  useEffect(() => {
    const existing = loadReportBuilderSettings(storageKeyInputs.clientId, storageKeyInputs.fiscalYear) || {};
    saveReportBuilderSettings(storageKeyInputs.clientId, storageKeyInputs.fiscalYear, {
      ...existing,
      scopeType,
      selectedClientIds,
    });
  }, [scopeType, selectedClientIds, storageKeyInputs]);

  const setScopeType = useCallback((t: ScopeType) => setScopeTypeState(t), []);
  const setSelectedClientIds = useCallback((ids: string[]) => setSelectedClientIdsState(ids), []);

  const value = useMemo(() => ({ scopeType, setScopeType, selectedClientIds, setSelectedClientIds }), [scopeType, setScopeType, selectedClientIds, setSelectedClientIds]);

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useScope() {
  console.log('useScope called');
  const ctx = useContext(ScopeContext);
  console.log('useScope context value:', ctx);
  if (!ctx) {
    console.error('useScope: No context found! ScopeProvider is missing.');
    throw new Error('useScope must be used within a ScopeProvider');
  }
  return ctx;
}
