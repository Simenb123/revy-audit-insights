import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface HeatmapPoint {
  x: string;
  y: string;
  value: number;
}

export function useHeatmapData(clientId?: string) {
  return useQuery({
    queryKey: ['heatmap-data', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<HeatmapPoint[]> => {
      const { data, error } = await supabase
        .from('heatmap_data' as any)
        .select('x, y, value')
        .eq('client_id', clientId);

      if (error || !data) {
        return [];
      }

      return data.map((d: any) => ({
        x: d.x,
        y: d.y,
        value: d.value,
      }));
    },
  });
}
