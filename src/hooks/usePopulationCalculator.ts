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
        console.log('No standard numbers selected, returning empty population');
        return {
          size: 0,
          sum: 0,
          accounts: []
        };
      }

      // Log parameters for debugging
      console.log('Population calculator parameters:', {
        clientId,
        fiscalYear,
        selectedStandardNumbers,
        excludedAccountNumbers,
        versionId
      });

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

        console.log('Calling RPC with parameters:', {
          p_client_id: clientId,
          p_fiscal_year: fiscalYear,
          p_selected_standard_numbers: selectedStandardNumbers,
          p_excluded_account_numbers: excludedAccountNumbers,
          p_version_id,
          p_version_string
        });

        // Call the RPC function with version string (preferred) since activeTrialBalanceVersion uses version strings
        let rpcCall;
        if (p_version_string) {
          // Use the overload that takes version string (e.g., "v10")
          console.log('🚀 Calling RPC with version string:', p_version_string);
          rpcCall = supabase.rpc('calculate_population_analysis', {
            p_client_id: clientId,
            p_fiscal_year: fiscalYear,
            p_selected_standard_numbers: selectedStandardNumbers,
            p_excluded_account_numbers: excludedAccountNumbers,
            p_version_string
          });
        } else if (p_version_id) {
          // Use the overload that takes UUID
          console.log('🚀 Calling RPC with version UUID:', p_version_id);
          rpcCall = supabase.rpc('calculate_population_analysis', {
            p_client_id: clientId,
            p_fiscal_year: fiscalYear,
            p_selected_standard_numbers: selectedStandardNumbers,
            p_excluded_account_numbers: excludedAccountNumbers,
            p_version_id
          });
        } else {
          // Use the overload without version (will use latest/active)
          console.log('🚀 Calling RPC without version (will use latest/active)');
          rpcCall = supabase.rpc('calculate_population_analysis', {
            p_client_id: clientId,
            p_fiscal_year: fiscalYear,
            p_selected_standard_numbers: selectedStandardNumbers,
            p_excluded_account_numbers: excludedAccountNumbers
          });
        }

        const { data, error } = await rpcCall;

        if (error) {
          console.error('RPC Error calculating population:', error);
          console.error('RPC Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          
          // Fallback to edge function if RPC fails
          console.log('Falling back to edge function...');
          try {
            const fallbackResponse = await supabase.functions.invoke('calculate-population-from-accounts', {
              body: {
                clientId,
                fiscalYear,
                selectedStandardNumbers,
                excludedAccountNumbers,
                version: versionId
              }
            });

            if (fallbackResponse.error) {
              console.error('Edge function also failed:', fallbackResponse.error);
              // Return empty result instead of throwing
              return {
                size: 0,
                sum: 0,
                accounts: []
              };
            }

            const fallbackData = fallbackResponse.data;
            if (!fallbackData || typeof fallbackData !== 'object') {
              console.warn('Invalid response from fallback function');
              return {
                size: 0,
                sum: 0,
                accounts: []
              };
            }

            return {
              size: fallbackData.size || 0,
              sum: fallbackData.sum || 0,
              accounts: (fallbackData.accounts || []).map((acc: any) => ({
                account_number: acc.account_number,
                account_name: acc.account_name,
                closing_balance: acc.closing_balance,
                transaction_count: acc.transaction_count || 0
              }))
            };
          } catch (fallbackError) {
            console.error('Both RPC and fallback failed:', fallbackError);
            return {
              size: 0,
              sum: 0,
              accounts: []
            };
          }
        }

        if (!data || typeof data !== 'object') {
          console.warn('Empty or invalid data returned from RPC');
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

        // Use basicStats directly from RPC response - it should handle exclusions server-side
        let size: number;
        let sum: number;
        
        if (responseData.basicStats?.totalAccounts !== undefined && responseData.basicStats?.totalSum !== undefined) {
          // Trust the RPC function to handle exclusions properly
          size = responseData.basicStats.totalAccounts;
          sum = responseData.basicStats.totalSum;
          
          console.log('✅ Using RPC basicStats (with server-side exclusions):', {
            populationSize: size,
            populationSum: sum
          });
        } else {
          // Fallback to client-side calculation with manual exclusions
          const includedAccounts = accounts.filter((account) => 
            !excludedAccountNumbers.includes(account.account_number)
          );
          size = includedAccounts.length;
          sum = includedAccounts.reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);
          
          console.log('⚠️ Using fallback calculation (RPC basicStats missing):', {
            totalAccounts: accounts.length,
            excludedCount: accounts.length - includedAccounts.length,
            populationSize: size,
            populationSum: sum
          });
        }

        return {
          size,
          sum,
          accounts: accounts // Return all accounts, UI handles inclusion/exclusion display
        };

      } catch (error) {
        console.error('Population calculator error:', error);
        
        // Return empty result instead of throwing to prevent crashes
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