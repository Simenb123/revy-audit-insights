import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAvailableVersions = (clientId: string) => {
  return useQuery({
    queryKey: ['available-versions', clientId],
    queryFn: async () => {
      if (!clientId) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('accounting_data_versions')
        .select('id, version_number, file_name, is_active')
        .eq('client_id', clientId)
        .order('version_number');

      if (error) throw error;

      // If no versions exist, return default empty array
      if (!data || data.length === 0) {
        return [];
      }

      // Return version objects with actual UUID as value
      return data.map(version => ({
        value: version.id, // Use actual UUID instead of version string
        label: `Versjon ${version.version_number} - ${version.file_name}`,
        version_number: version.version_number,
        file_name: version.file_name,
        is_active: version.is_active
      }));
    },
    enabled: !!clientId,
  });
};