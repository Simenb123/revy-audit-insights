import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GeneralLedgerTransaction {
  id: string;
  transaction_date: string;
  client_account_id: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  reference_number: string;
  voucher_number: string;
  period_year: number;
  period_month: number;
}

export const useGeneralLedgerData = (clientId: string) => {
  return useQuery({
    queryKey: ['general-ledger', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('general_ledger_transactions')
        .select(`
          id,
          transaction_date,
          client_account_id,
          description,
          debit_amount,
          credit_amount,
          reference_number,
          voucher_number,
          period_year,
          period_month
        `)
        .eq('client_id', clientId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      return data as GeneralLedgerTransaction[];
    },
    enabled: !!clientId,
  });
};