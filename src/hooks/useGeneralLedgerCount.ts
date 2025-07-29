import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useGeneralLedgerCount = (clientId: string, versionId?: string) => {
  return useQuery({
    queryKey: ['general-ledger-count', clientId, versionId],
    queryFn: async () => {
      let query = supabase
        .from('general_ledger_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId);

      // Filter by version if specified
      if (versionId) {
        query = query.eq('version_id', versionId);
      } else {
        // If no version specified, get active version data
        const { data: activeVersion } = await supabase
          .from('accounting_data_versions')
          .select('id')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .single();
        
        if (activeVersion) {
          query = query.eq('version_id', activeVersion.id);
        }
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};