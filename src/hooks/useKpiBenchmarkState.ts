import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ClientInfo } from '@/types/kpi';

interface Params {
  scopeType: string;
  showBenchmark: boolean;
  selectedClientIds?: string[] | null;
}

export function useKpiBenchmarkState({ scopeType, showBenchmark, selectedClientIds }: Params) {
  const [clientsInfo, setClientsInfo] = React.useState<ClientInfo[]>([]);
  const [valuesByClient, setValuesByClient] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const load = async () => {
      if (scopeType !== 'custom' || !showBenchmark || !selectedClientIds || selectedClientIds.length === 0) {
        setClientsInfo([]);
        return;
      }
      const { data = [] } = await supabase
        .from('clients' as any)
        .select('id, company_name, name, client_group')
        .in('id', selectedClientIds);
      const items = (data as any[]).map((c) => ({ id: c.id, name: c.company_name || c.name || c.id, group: c.client_group || 'Uten gruppe' }));
      setClientsInfo(items);
    };
    load();
  }, [scopeType, showBenchmark, selectedClientIds]);

  const groupNames = React.useMemo(() => Array.from(new Set((clientsInfo || []).map((c) => c.group || 'Uten gruppe'))), [clientsInfo]);

  const setClientValue = React.useCallback((id: string, val: number) => {
    setValuesByClient((prev) => ({ ...prev, [id]: val }));
  }, []);

  return { clientsInfo, valuesByClient, setClientValue, groupNames };
}
