import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface WaterfallPoint {
  name: string;
  value: number;
}

export function useWaterfallData(clientId?: string) {
  return useQuery({
    queryKey: ['waterfall-data', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<WaterfallPoint[]> => {
      const { data, error } = await supabase
        .from('waterfall_data' as any)
        .select('name, value')
        .eq('client_id', clientId);

      if (error || !data) {
        return [];
      }

      return data.map((d) => ({ name: d.name, value: d.value }));
    },
  });
}
