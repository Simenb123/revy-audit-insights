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

      // Get trial balance data for the selected fiscal year
      let query = supabase
        .from('trial_balances')
        .select(`
          account_number,
          account_name,
          closing_balance,
          client_chart_of_accounts!inner(
            standard_account_mappings(
              standard_account_id,
              standard_accounts(standard_number)
            )
          )
        `)
        .eq('client_id', clientId)
        .eq('period_year', fiscalYear)
        .neq('closing_balance', 0);

      if (versionId) {
        query = query.eq('version_id', versionId);
      }

      const { data: trialBalanceData, error } = await query;

      if (error) throw error;

      // Filter accounts based on selected standard numbers
      const filteredAccounts = (trialBalanceData || []).filter(account => {
        // Check if account is mapped to any of the selected standard accounts
        const mappings = account.client_chart_of_accounts?.standard_account_mappings || [];
        const hasSelectedStandard = mappings.some((mapping: any) => 
          selectedStandardNumbers.includes(mapping.standard_accounts?.standard_number)
        );
        
        // Exclude specifically excluded accounts
        const isExcluded = excludedAccountNumbers.includes(account.account_number);
        
        return hasSelectedStandard && !isExcluded;
      });

      // Get transaction counts for each account
      const accountNumbers = filteredAccounts.map(acc => acc.account_number);
      
      let transactionQuery = supabase
        .from('general_ledger_transactions')
        .select('account_number')
        .eq('client_id', clientId)
        .in('account_number', accountNumbers);

      if (fiscalYear) {
        const startDate = `${fiscalYear}-01-01`;
        const endDate = `${fiscalYear}-12-31`;
        transactionQuery = transactionQuery
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate);
      }

      if (versionId) {
        transactionQuery = transactionQuery.eq('version_id', versionId);
      }

      const { data: transactions, error: transactionError } = await transactionQuery;
      
      if (transactionError) throw transactionError;

      // Count transactions per account
      const transactionCounts: Record<string, number> = {};
      transactions?.forEach(tx => {
        transactionCounts[tx.account_number] = (transactionCounts[tx.account_number] || 0) + 1;
      });

      // Build final account list with transaction counts
      const accounts = filteredAccounts.map(account => ({
        account_number: account.account_number,
        account_name: account.account_name || 'Ukjent konto',
        closing_balance: account.closing_balance || 0,
        transaction_count: transactionCounts[account.account_number] || 0
      }));

      const totalSum = accounts.reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);

      return {
        size: accounts.length,
        sum: totalSum,
        accounts
      };
    },
    enabled: !!clientId && selectedStandardNumbers.length > 0
  });
}