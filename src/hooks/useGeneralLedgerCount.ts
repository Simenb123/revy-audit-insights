import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useGeneralLedgerCount = (clientId: string, versionId?: string, filters?: { accountNumber?: string }) => {
  return useQuery({
    queryKey: ['general-ledger-count', clientId, versionId, filters?.accountNumber],
    queryFn: async () => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      let query = supabase
        .from('general_ledger_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId);

      // Version handling - find active version if not provided
      let effectiveVersionId = versionId;
      if (!effectiveVersionId) {
        // Try to find active version
        const { data: activeVersion } = await supabase
          .from('accounting_data_versions')
          .select('id')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .maybeSingle();

        if (activeVersion) {
          effectiveVersionId = activeVersion.id;
        } else {
          // Fallback to latest version
          const { data: latestVersion } = await supabase
            .from('accounting_data_versions')
            .select('id')
            .eq('client_id', clientId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestVersion) {
            effectiveVersionId = latestVersion.id;
          }
        }
      }

      // Apply version filter if we have one
      if (effectiveVersionId) {
        query = query.eq('version_id', effectiveVersionId);
      }

      // Apply account number filter if provided
      if (filters?.accountNumber) {
        query = query.eq('account_number', filters.accountNumber);
      }

      const { count, error } = await query;
      if (error) throw error;

      return count || 0;
    },
    enabled: !!clientId, // Only require clientId - version resolution happens in queryFn
    staleTime: 60_000, // Cache for 60 seconds
    gcTime: 300_000, // Keep in cache for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
};