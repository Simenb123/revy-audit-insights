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

      // Get uploaded documents count as proxy for accounting data
      const { data: docsData, error: docsError } = await supabase
        .from('client_documents_files')
        .select('id, created_at, file_name')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      // Filter for accounting-related files
      const accountingDocs = docsData?.filter(doc => 
        doc.file_name.toLowerCase().includes('hovedbok') ||
        doc.file_name.toLowerCase().includes('saldobalanse') ||
        doc.file_name.toLowerCase().includes('trial') ||
        doc.file_name.toLowerCase().includes('general') ||
        doc.file_name.toLowerCase().includes('ledger')
      ) || [];

      const latestAccountingDoc = accountingDocs[0] || null;

      return {
        chartOfAccountsCount: chartData?.length || 0,
        latestAccountingFile: latestAccountingDoc,
        accountingDocsCount: accountingDocs.length,
      };
    },
    enabled: !!clientId,
  });
};