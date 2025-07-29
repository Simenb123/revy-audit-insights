import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GeneralLedgerTransaction {
  id: string;
  transaction_date: string;
  client_account_id: string;
  account_number: string;
  account_name: string;
  description: string;
  debit_amount: number | null;
  credit_amount: number | null;
  balance_amount: number | null;
  reference_number: string;
  voucher_number: string;
  period_year: number;
  period_month: number;
}

export const useGeneralLedgerData = (clientId: string) => {
  return useQuery({
    queryKey: ['general-ledger', clientId],
    queryFn: async () => {
      console.log('🔍 Fetching general ledger data for client:', clientId);
      
      const { data, error } = await supabase
        .from('general_ledger_transactions')
        .select(`
          id,
          transaction_date,
          client_account_id,
          description,
          debit_amount,
          credit_amount,
          balance_amount,
          reference_number,
          voucher_number,
          period_year,
          period_month,
          client_chart_of_accounts!inner(
            account_number,
            account_name
          )
        `)
        .eq('client_id', clientId)
        .order('transaction_date', { ascending: false })
        .limit(100000); // Set explicit high limit to ensure all transactions are fetched

      if (error) {
        console.error('❌ Error fetching general ledger:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No general ledger transactions found for client:', clientId);
        return [];
      }

      console.log('✅ Found', data.length, 'general ledger transactions');
      
      // Transform the data to include account details
      const transformedData = data.map(transaction => ({
        id: transaction.id,
        transaction_date: transaction.transaction_date,
        client_account_id: transaction.client_account_id,
        account_number: transaction.client_chart_of_accounts?.account_number || 'Ukjent',
        account_name: transaction.client_chart_of_accounts?.account_name || 'Ukjent konto',
        description: transaction.description,
        debit_amount: transaction.debit_amount,
        credit_amount: transaction.credit_amount,
        balance_amount: transaction.balance_amount,
        reference_number: transaction.reference_number || '',
        voucher_number: transaction.voucher_number || '',
        period_year: transaction.period_year,
        period_month: transaction.period_month,
      })) as GeneralLedgerTransaction[];

      console.log('📊 General Ledger Summary:', {
        totalTransactions: transformedData.length,
        dateRange: transformedData.length > 0 ? {
          from: transformedData[transformedData.length - 1]?.transaction_date,
          to: transformedData[0]?.transaction_date
        } : null
      });

      return transformedData;
    },
    enabled: !!clientId,
  });
};