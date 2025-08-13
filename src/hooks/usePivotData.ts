import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface PivotDataParams {
  clientId?: string;
  fiscalYear?: number;
  rowField?: string;
  columnField?: string;
  valueField?: string;
}

export function usePivotData({
  clientId,
  fiscalYear,
  rowField,
  columnField,
  valueField,
}: PivotDataParams) {
  return useQuery({
    queryKey: ['pivot-data', clientId, fiscalYear, rowField, columnField, valueField],
    enabled: !!clientId && !!fiscalYear,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_balance_entries' as any)
        .select('*')
        .eq('client_id', clientId)
        .eq('period_year', fiscalYear);

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
