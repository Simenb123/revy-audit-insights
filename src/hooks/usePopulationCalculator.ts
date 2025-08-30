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

      // Use the new optimized SQL function
      const { data, error } = await supabase.rpc('calculate_population_analysis', {
        p_client_id: clientId,
        p_fiscal_year: fiscalYear,
        p_selected_standard_numbers: selectedStandardNumbers,
        p_excluded_account_numbers: excludedAccountNumbers,
        p_version_id: versionId || null
      });

      if (error) {
        console.error('Error calculating population:', error);
        throw error;
      }

      if (!data || typeof data !== 'object') {
        return {
          size: 0,
          sum: 0,
          accounts: []
        };
      }

      // Type the response data properly
      const responseData = data as {
        accounts?: Array<{
          accountNumber: string;
          accountName: string;
          closingBalance: number;
          transactionCount: number;
        }>;
      };

      const accounts = (responseData.accounts || []).map((acc) => ({
        account_number: acc.accountNumber,
        account_name: acc.accountName,
        closing_balance: acc.closingBalance,
        transaction_count: acc.transactionCount
      }));

      // Calculate included statistics (excluding specified accounts)
      const includedAccounts = accounts.filter((account) => 
        !excludedAccountNumbers.includes(account.account_number)
      );
      const includedSum = includedAccounts.reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);

      return {
        size: includedAccounts.length,
        sum: includedSum,
        accounts: accounts // Return all accounts, UI handles inclusion/exclusion display
      };
    },
    enabled: !!clientId
  });
}