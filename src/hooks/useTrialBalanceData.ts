import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrialBalanceEntry {
  id: string;
  client_account_id: string;
  closing_balance: number;
  credit_turnover: number;
  debit_turnover: number;
  opening_balance: number;
  period_end_date: string;
  period_year: number;
}

export const useTrialBalanceData = (clientId: string) => {
  return useQuery({
    queryKey: ['trial-balance', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_balances')
        .select('*')
        .eq('client_id', clientId)
        .order('period_year', { ascending: false });

      if (error) throw error;
      return data as TrialBalanceEntry[];
    },
    enabled: !!clientId,
  });
};