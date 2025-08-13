import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useGeneralLedgerCount = (clientId: string, versionId?: string, filters?: { accountNumber?: string }) => {
  return useQuery({
    queryKey: ['general-ledger-count-v6', clientId, versionId, filters?.accountNumber],
    queryFn: async () => {
      console.log('🔍 Fetching general ledger count for client:', clientId, 'version:', versionId);
      
      let query = supabase
        .from('general_ledger_transactions')
        .select(filters?.accountNumber ? 'id, client_chart_of_accounts(account_number)' : 'id', { count: 'exact', head: true })
        .eq('client_id', clientId);

      if (filters?.accountNumber) {
        query = query.eq('client_chart_of_accounts.account_number', filters.accountNumber);
      }

      // Filter by version if specified
      if (versionId) {
        query = query.eq('version_id', versionId);
      } else {
        // If no version specified, get active version data with same logic as useGeneralLedgerData
        console.log('🔍 No version specified for count, finding active version...');
        const { data: activeVersion, error: versionError } = await supabase
          .from('accounting_data_versions')
          .select('id')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (versionError) {
          console.error('❌ Error finding active version for count:', versionError);
          // Try to get the latest version instead
          const { data: latestVersion } = await supabase
            .from('accounting_data_versions')
            .select('id')
            .eq('client_id', clientId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (latestVersion) {
            console.log('🔄 Using latest version for count:', latestVersion.id);
            query = query.eq('version_id', latestVersion.id);
          }
        } else if (activeVersion) {
          console.log('✅ Found active version for count:', activeVersion.id);
          query = query.eq('version_id', activeVersion.id);
        } else {
          console.log('⚠️ No active version found for count, trying latest version...');
          const { data: latestVersion } = await supabase
            .from('accounting_data_versions')
            .select('id')
            .eq('client_id', clientId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (latestVersion) {
            console.log('🔄 Using latest version for count:', latestVersion.id);
            query = query.eq('version_id', latestVersion.id);
          }
        }
      }

      const { count, error } = await query;

      if (error) {
        console.error('❌ Error fetching count:', error);
        throw error;
      }
      
      console.log('📊 General ledger count:', count);
      return count || 0;
    },
    enabled: !!clientId,
    staleTime: 0, // Force fresh data to show latest count
    gcTime: 0, // No caching to ensure we see new data immediately
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};