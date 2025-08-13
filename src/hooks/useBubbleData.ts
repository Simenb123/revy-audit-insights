import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface BubblePoint {
  x: number;
  y: number;
  z: number;
}

export function useBubbleData(clientId?: string) {
  return useQuery({
    queryKey: ['bubble-data', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<BubblePoint[]> => {
      const { data, error } = await supabase
        .from('bubble_data' as any)
        .select('x, y, z')
        .eq('client_id', clientId);

      if (error || !data) {
        return [];
      }

      return data.map((d) => ({ x: d.x, y: d.y, z: d.z }));
    },
  });
}
