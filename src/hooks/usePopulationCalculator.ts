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
  isEmpty?: boolean;
  emptyReason?: string;
  error?: string;
  metadata?: {
    versionString?: string;
    executionTimeMs?: number;
    totalRecords?: number;
    hasDataForYear?: boolean;
    availableYears?: number[];
  };
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
      // If no standard accounts selected, return empty population with reason
      if (selectedStandardNumbers.length === 0) {
        return {
          size: 0,
          sum: 0,
          accounts: [],
          isEmpty: true,
          emptyReason: 'no_standard_accounts'
        };
      }

      try {
        // Improved version parameter handling
        const rpcParams: any = {
          p_client_id: clientId,
          p_fiscal_year: fiscalYear,
          p_selected_standard_numbers: selectedStandardNumbers,
          p_excluded_account_numbers: excludedAccountNumbers
        };

        // Handle version parameter correctly
        if (versionId) {
          if (versionId.startsWith('v')) {
            // It's a version string like "v10"
            rpcParams.p_version_string = versionId;
          } else if (versionId.length === 36 && versionId.includes('-')) {
            // It's a UUID
            rpcParams.p_version_id = versionId;
          } else {
            // Default to version string for any other format
            rpcParams.p_version_string = versionId;
          }
        }

        const { data, error } = await supabase.rpc('calculate_population_analysis', rpcParams);

        if (error) {
          throw new Error(`RPC error: ${error.message}`);
        }

        if (!data) {
          return {
            size: 0,
            sum: 0,
            accounts: [],
            isEmpty: true,
            emptyReason: 'no_data_returned'
          };
        }

        // Parse the JSONB response properly
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
          metadata?: {
            versionString?: string;
            executionTimeMs?: number;
            totalRecords?: number;
          };
        };

        const accounts = (responseData.accounts || []).map((acc) => ({
          account_number: acc.accountNumber,
          account_name: acc.accountName,
          closing_balance: acc.closingBalance,
          transaction_count: acc.transactionCount
        }));

        // Use basicStats from RPC response (server-side calculation with exclusions)
        let size = 0;
        let sum = 0;
        
        if (responseData.basicStats?.totalAccounts !== undefined && responseData.basicStats?.totalSum !== undefined) {
          // Use RPC calculated values
          size = responseData.basicStats.totalAccounts;
          sum = responseData.basicStats.totalSum;
        } else {
          // Fallback calculation (shouldn't be needed with improved RPC)
          const includedAccounts = accounts.filter((account) => 
            !excludedAccountNumbers.includes(account.account_number)
          );
          size = includedAccounts.length;
          sum = includedAccounts.reduce((total, acc) => total + Math.abs(acc.closing_balance), 0);
        }

        // Determine if population is legitimately empty and why
        const isEmpty = size === 0 && sum === 0;
        let emptyReason: string | undefined;
        
        if (isEmpty) {
          if (accounts.length === 0) {
            emptyReason = 'no_matching_accounts';
          } else if (accounts.every(acc => Math.abs(acc.closing_balance) === 0)) {
            emptyReason = 'zero_balances';
          } else {
            emptyReason = 'all_excluded';
          }
        }

        return {
          size,
          sum,
          accounts,
          isEmpty,
          emptyReason,
          metadata: responseData.metadata
        };

      } catch (error) {
        // Distinguish between network errors and legitimate empty results
        const isNetworkError = error instanceof Error && 
          (error.message.includes('fetch') || error.message.includes('network'));
        
        if (isNetworkError) {
          throw error; // Let react-query handle retries for network errors
        }

        // For other errors, return empty result with error info
        return {
          size: 0,
          sum: 0,
          accounts: [],
          isEmpty: true,
          emptyReason: 'system_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },
    enabled: !!clientId && selectedStandardNumbers.length > 0,
    staleTime: 60_000, // Cache for 60 seconds
    gcTime: 300_000,   // Keep in cache for 5 minutes
    retry: (failureCount: number, error: any) => {
      // Only retry on network errors, not on business logic errors
      const isNetworkError = error?.message?.includes('fetch') || 
                            error?.message?.includes('network') || 
                            error?.message?.includes('timeout');
      return failureCount < 2 && isNetworkError;
    }
  });
}