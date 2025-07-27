import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAccountingData = (clientId: string) => {
  return useQuery({
    queryKey: ['accounting-data', clientId],
    queryFn: async () => {
      // Get chart of accounts count
      const { data: chartData, error: chartError } = await supabase
        .from('client_chart_of_accounts')
        .select('id')
        .eq('client_id', clientId);

      if (chartError) throw chartError;

      // Get general ledger transactions count
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('general_ledger_transactions')
        .select('id, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

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
        generalLedgerTransactionsCount: transactionsData?.length || 0,
        latestGeneralLedgerUpload: latestGeneralLedgerUpload,
        hasGeneralLedger: (transactionsData?.length || 0) > 0,
      };
    },
    enabled: !!clientId,
  });
};