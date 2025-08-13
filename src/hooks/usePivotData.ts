import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface PivotDataParams {
  clientId?: string;
  fiscalYear?: number;
  rowField?: string;
  columnField?: string;
  valueField?: string;
  scopeType?: 'client' | 'firm' | 'custom';
  selectedClientIds?: string[];
}

export function usePivotData({
  clientId,
  fiscalYear,
  rowField,
  columnField,
  valueField,
  scopeType = 'client',
  selectedClientIds = [],
}: PivotDataParams) {
  return useQuery({
    queryKey: ['pivot-data', clientId, fiscalYear, rowField, columnField, valueField, scopeType, selectedClientIds?.join(',')],
    enabled: !!fiscalYear && ((scopeType === 'firm') || (scopeType === 'custom' && selectedClientIds.length > 0) || !!clientId),
    queryFn: async () => {
      let data: any[] | null = null;
      let error: any = null;

      if (scopeType === 'firm') {
        const rpc = await supabase.rpc('get_firm_trial_balance_entries' as any, {
          p_fiscal_year: fiscalYear ?? null,
        });
        data = rpc.data as any[] | null;
        error = rpc.error;

        if (error) {
          const tbl = await supabase
            .from('trial_balance_entries' as any)
            .select('*')
            .eq('period_year', fiscalYear);
          data = tbl.data as any[] | null;
          error = tbl.error;
        }
      } else if (scopeType === 'custom') {
        const tbl = await supabase
          .from('trial_balance_entries' as any)
          .select('*')
          .in('client_id', selectedClientIds)
          .eq('period_year', fiscalYear);
        data = tbl.data as any[] | null;
        error = tbl.error;
      } else {
        const tbl = await supabase
          .from('trial_balance_entries' as any)
          .select('*')
          .eq('client_id', clientId)
          .eq('period_year', fiscalYear);
        data = tbl.data as any[] | null;
        error = tbl.error;
      }

      if (error || !data) {
        return [] as any[];
      }

      // Enrich with client labels for custom scope to enable client/konsern columns
      if (scopeType === 'custom' && selectedClientIds.length > 0) {
        const { data: clients = [] } = await supabase
          .from('clients' as any)
          .select('id, company_name, client_group')
          .in('id', selectedClientIds);
        const nameMap = new Map<string, string>();
        const groupMap = new Map<string, string | null>();
        (clients as any[]).forEach((c: any) => {
          nameMap.set(c.id, c.company_name || c.name || c.id);
          groupMap.set(c.id, c.client_group ?? null);
        });
        data = data.map((entry: any) => ({
          ...entry,
          client_name: nameMap.get(entry.client_id) ?? entry.client_id,
          client_group: groupMap.get(entry.client_id) ?? null,
        }));
      }

      if (!rowField && !columnField && !valueField) {
        return data as any[];
      }

      return data.map((entry: any) => ({
        ...(rowField ? { [rowField]: entry[rowField] } : {}),
        ...(columnField ? { [columnField]: entry[columnField] } : {}),
        ...(valueField ? { [valueField]: entry[valueField] } : {}),
      }));
    },
  });
}
