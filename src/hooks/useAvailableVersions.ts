import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAvailableVersions = (clientId: string) => {
  return useQuery({
    queryKey: ['available-versions', clientId],
    queryFn: async () => {
      if (!clientId) {
        return ['v1'];
      }
      
      const { data, error } = await supabase
        .from('trial_balances')
        .select('version')
        .eq('client_id', clientId)
        .order('version');

      if (error) throw error;

      // Get unique versions and ensure we always have at least v1
      const uniqueVersions = [...new Set(data.map(d => d.version).filter(Boolean))];
      
      // If no versions exist, return default options
      if (uniqueVersions.length === 0) {
        return ['v1'];
      }

      // Sort versions naturally (v1, v2, v10, etc.)
      return uniqueVersions.sort((a, b) => {
        const numA = parseInt(a.replace('v', ''));
        const numB = parseInt(b.replace('v', ''));
        return numA - numB;
      });
    },
    enabled: !!clientId,
  });
};