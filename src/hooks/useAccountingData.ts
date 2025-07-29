import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAccountingData = (clientId: string) => {
  return useQuery({
    queryKey: ['accounting-data-v3', clientId],
    queryFn: async () => {
      // Get chart of accounts count
      const { data: chartData, error: chartError } = await supabase
        .from('client_chart_of_accounts')
        .select('id')
        .eq('client_id', clientId);

      if (chartError) throw chartError;

      // Get general ledger transactions count using chunked approach
      console.log('🔢 Counting ALL general ledger transactions for client:', clientId);
      
      let totalTransactionCount = 0;
      let offset = 0;
      const chunkSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: chunkData, error: transactionsError } = await supabase
          .from('general_ledger_transactions')
          .select('id')
          .eq('client_id', clientId)
          .range(offset, offset + chunkSize - 1);

        if (transactionsError) throw transactionsError;

        if (!chunkData || chunkData.length === 0) {
          hasMore = false;
          break;
        }

        totalTransactionCount += chunkData.length;
        
        if (chunkData.length < chunkSize) {
          hasMore = false;
        } else {
          offset += chunkSize;
        }
      }

      console.log('📊 ACCOUNTING DATA - Total transactions found:', totalTransactionCount);

      // Get latest general ledger upload batch
      const { data: batchData, error: batchError } = await supabase
        .from('upload_batches')
        .select('id, created_at, file_name, status')
        .eq('client_id', clientId)
        .eq('batch_type', 'general_ledger')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (batchError) throw batchError;

      const latestGeneralLedgerUpload = batchData?.[0] || null;

      return {
        chartOfAccountsCount: chartData?.length || 0,
        generalLedgerTransactionsCount: totalTransactionCount,
        latestGeneralLedgerUpload: latestGeneralLedgerUpload,
        hasGeneralLedger: totalTransactionCount > 0,
      };
    },
    enabled: !!clientId,
    staleTime: 0, // Force fresh data
    gcTime: 0, // No caching for debugging
  });
};