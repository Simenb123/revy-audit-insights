import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAccountingData = (clientId: string) => {
  return useQuery({
    queryKey: ['accounting-data-v4', clientId],
    queryFn: async () => {
      try {
        // Run all queries in parallel for better performance
        const [chartResult, transactionsResult, batchResult] = await Promise.all([
          // Get chart of accounts count
          supabase
            .from('client_chart_of_accounts')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId),
          
          // Get general ledger transactions count efficiently using COUNT
          supabase
            .from('general_ledger_transactions')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId),
          
          // Get latest general ledger upload batch
          supabase
            .from('upload_batches')
            .select('id, created_at, file_name, status')
            .eq('client_id', clientId)
            .eq('batch_type', 'general_ledger')
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1)
        ]);

        // Handle errors from parallel queries
        if (chartResult.error) throw chartResult.error;
        if (transactionsResult.error) throw transactionsResult.error;
        if (batchResult.error) throw batchResult.error;

        const chartOfAccountsCount = chartResult.count || 0;
        const generalLedgerTransactionsCount = transactionsResult.count || 0;
        const latestGeneralLedgerUpload = batchResult.data?.[0] || null;

        console.log('📊 ACCOUNTING DATA - Optimized counts:', {
          chartOfAccountsCount,
          generalLedgerTransactionsCount,
          latestUpload: latestGeneralLedgerUpload?.file_name
        });

        return {
          chartOfAccountsCount,
          generalLedgerTransactionsCount,
          latestGeneralLedgerUpload,
          hasGeneralLedger: generalLedgerTransactionsCount > 0,
        };
      } catch (error) {
        console.error('Error in useAccountingData:', error);
        throw error;
      }
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};