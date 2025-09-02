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
  // Create stable query key to prevent infinite re-renders
  const stableQueryKey = [
    'population-calculator',
    clientId,
    fiscalYear,
    selectedStandardNumbers.length > 0 ? selectedStandardNumbers.slice().sort().join(',') : 'none',
    excludedAccountNumbers.length > 0 ? excludedAccountNumbers.slice().sort().join(',') : 'none',
    versionId || 'latest'
  ];

  return useQuery({
    queryKey: stableQueryKey,
    queryFn: async (): Promise<PopulationData> => {
      // If no standard accounts selected, return empty population
      if (selectedStandardNumbers.length === 0) {
        return {
          size: 0,
          sum: 0,
          accounts: []
        };
      }

      try {
        // Determine whether versionId is a UUID or a version string
        let p_version_id: string | null = null;
        let p_version_string: string | null = null;
        
        if (versionId) {
          if (versionId.startsWith('v')) {
            // It's a version string like "v10"
            p_version_string = versionId;
          } else if (versionId.length === 36 && versionId.includes('-')) {
            // It's a UUID
            p_version_id = versionId;
          } else {
            // Try as version string if it's not clearly a UUID
            p_version_string = versionId;
          }
        }


        // Call the correct RPC function based on version type
        let rpcCall;
        if (p_version_string) {
          // Call with version string parameter (v10, v28, etc.)
          rpcCall = supabase.rpc('calculate_population_analysis', {
            p_client_id: clientId,
            p_fiscal_year: fiscalYear,
            p_selected_standard_numbers: selectedStandardNumbers,
            p_excluded_account_numbers: excludedAccountNumbers,
            p_version_string
          });
        } else {
          // Call without version (will find latest/active automatically)
          rpcCall = supabase.rpc('calculate_population_analysis', {
            p_client_id: clientId,
            p_fiscal_year: fiscalYear,
            p_selected_standard_numbers: selectedStandardNumbers,
            p_excluded_account_numbers: excludedAccountNumbers
          });
        }

        const { data, error } = await rpcCall;

        if (error) {
          console.error('Population RPC error:', error);
          return {
            size: 0,
            sum: 0,
            accounts: []
          };
        }

        if (!data || typeof data !== 'object' || data === true) {
          console.warn('Invalid RPC response data:', data);
          return {
            size: 0,
            sum: 0,
            accounts: []
          };
        }

        // Type the response data properly from the fixed SQL function
        const responseData = data as {
          accounts?: Array<{
            accountNumber: string;
            accountName: string;
            closingBalance: number;
            transactionCount: number;
          }>;
          basicStats?: {
            totalAccounts: number;
            totalSum: number;
          };
        };

        const accounts = (responseData.accounts || []).map((acc) => ({
          account_number: acc.accountNumber,
          account_name: acc.accountName,
          closing_balance: acc.closingBalance,
          transaction_count: acc.transactionCount
        }));

        // Use basicStats from RPC response - it should handle exclusions server-side
        let size = 0;
        let sum = 0;
        
        if (responseData.basicStats?.totalAccounts !== undefined && responseData.basicStats?.totalSum !== undefined) {
          // Use RPC calculated values (server-side exclusions handled)
          size = responseData.basicStats.totalAccounts;
          sum = responseData.basicStats.totalSum;
        } else {
          // Fallback to client-side calculation if RPC basicStats missing
          const includedAccounts = accounts.filter((account) => 
            !excludedAccountNumbers.includes(account.account_number)
          );
          size = includedAccounts.length;
          sum = includedAccounts.reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);
        }

        return {
          size,
          sum,
          accounts: accounts // Return all accounts, UI handles inclusion/exclusion display
        };

      } catch (error) {
        console.error('Population calculation error:', error);
        return {
          size: 0,
          sum: 0,
          accounts: []
        };
      }
    },
    enabled: !!clientId && selectedStandardNumbers.length > 0,
    retry: (failureCount: number, error: any) => {
      // Only retry on network errors, not on business logic errors
      return failureCount < 2 && !error?.message?.includes('not found');
    }
  });
}