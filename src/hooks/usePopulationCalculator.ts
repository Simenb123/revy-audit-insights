import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PopulationData {
  size: number;
  sum: number;
  accounts: Array<{
    account_number: string;
    account_name: string;
    closing_balance: number;
    transaction_count: number;
  }>;
}

export interface PopulationAccount {
  id: string;
  account_number: string;
  account_name: string;
  closing_balance: number;
  transaction_count: number;
}

export function usePopulationCalculator(
  clientId: string,
  fiscalYear: number,
  selectedStandardNumbers: string[],
  excludedAccountNumbers: string[],
  versionId?: string
) {
  return useQuery({
    queryKey: ['population-calculator', clientId, fiscalYear, selectedStandardNumbers, excludedAccountNumbers, versionId],
    queryFn: async (): Promise<PopulationData> => {
      // If no standard accounts selected, return empty population
      if (selectedStandardNumbers.length === 0) {
        return {
          size: 0,
          sum: 0,
          accounts: []
        };
      }

      // Simplified query to avoid type recursion issues
      const { data: trialBalanceData, error } = await supabase
        .from('trial_balances')
        .select('closing_balance, client_account_id')
        .eq('client_id', clientId)
        .eq('period_year', fiscalYear)
        .neq('closing_balance', 0);

      if (error) throw error;

      // Get account details separately
      const accountIds = trialBalanceData?.map(tb => tb.client_account_id).filter(Boolean) || [];
      
      const { data: accountData, error: accountError } = await supabase
        .from('client_chart_of_accounts')
        .select('id, account_number, account_name')
        .in('id', accountIds);

      if (accountError) throw accountError;

      // Map accounts with balances
      const accountMap = new Map(accountData?.map(acc => [acc.id, acc]) || []);
      
      const accounts = trialBalanceData
        ?.map(tb => {
          const account = accountMap.get(tb.client_account_id);
          if (!account) return null;
          
          return {
            account_number: account.account_number,
            account_name: account.account_name || 'Ukjent konto',
            closing_balance: tb.closing_balance || 0,
            transaction_count: 0 // Will be implemented later
          };
        })
        .filter(Boolean)
        .filter(account => !excludedAccountNumbers.includes(account!.account_number)) || [];

      const totalSum = (accounts as any[]).reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);

      return {
        size: (accounts as any[]).length,
        sum: totalSum,
        accounts: accounts as any[]
      };
    },
    enabled: !!clientId
  });
}