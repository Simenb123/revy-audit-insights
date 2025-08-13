import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface PivotDataParams {
  clientId?: string;
  fiscalYear?: number;
  rowField?: string;
  columnField?: string;
  valueField?: string;
  scopeType?: 'client' | 'firm';
}

export function usePivotData({
  clientId,
  fiscalYear,
  rowField,
  columnField,
  valueField,
  scopeType = 'client',
}: PivotDataParams) {
  return useQuery({
    queryKey: ['pivot-data', clientId, fiscalYear, rowField, columnField, valueField, scopeType],
    enabled: !!fiscalYear && (scopeType === 'firm' || !!clientId),
    queryFn: async () => {
      // Try firm-wide RPC when scope is 'firm'; fall back to table if not available
      let data: any[] | null = null;
      let error: any = null;

      if (scopeType === 'firm') {
        const rpc = await supabase.rpc('get_firm_trial_balance_entries' as any, {
          p_fiscal_year: fiscalYear ?? null,
        });
        data = rpc.data as any[] | null;
        error = rpc.error;

        if (error) {
          // Fallback to direct table query if RPC is not available
          const tbl = await supabase
            .from('trial_balance_entries' as any)
            .select('*')
            .eq('period_year', fiscalYear);
          data = tbl.data as any[] | null;
          error = tbl.error;
        }
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
