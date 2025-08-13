import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface GaugeData {
  value: number;
  max: number;
}

export function useGaugeData(clientId?: string) {
  return useQuery({
    queryKey: ['gauge-data', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<GaugeData> => {
      const { data, error } = await supabase
        .from('gauge_data' as any)
        .select('value, max')
        .eq('client_id', clientId)
        .single();

      if (error || !data) {
        return { value: 0, max: 100 };
      }

      return {
        value: data.value ?? 0,
        max: data.max ?? 100,
      };
    },
  });
}
