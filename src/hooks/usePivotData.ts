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
