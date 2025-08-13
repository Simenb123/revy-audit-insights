import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface TreemapNode {
  name: string;
  size: number;
}

export function useTreemapData(clientId?: string) {
  return useQuery({
    queryKey: ['treemap-data', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<TreemapNode[]> => {
      const { data, error } = await supabase
        .from('treemap_data' as any)
        .select('name, size')
        .eq('client_id', clientId);

      if (error || !data) {
        return [];
      }

      return data.map((d) => ({ name: d.name, size: d.size }));
    },
  });
}
