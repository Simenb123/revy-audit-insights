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
        // Convert versionId to UUID if it's a string like "v10"
        let uuid_version_id: string | null = null;
        if (versionId) {
          // If versionId looks like "vXX", try to find corresponding UUID
          if (versionId.startsWith('v')) {
            // For now, pass null and let the function handle version detection
            uuid_version_id = null;
            console.log(`Version string "${versionId}" detected, letting function auto-detect version`);
          } else {
            // Assume it's already a UUID
            uuid_version_id = versionId;
          }
        }

        // Use the fixed SQL function
        const { data, error } = await supabase.rpc('calculate_population_analysis', {
          p_client_id: clientId,
          p_fiscal_year: fiscalYear,
          p_selected_standard_numbers: selectedStandardNumbers,
          p_excluded_account_numbers: excludedAccountNumbers,
          p_version_id: uuid_version_id
        });

        if (error) {
          console.error('RPC Error calculating population:', error);
          
          // Fallback to edge function if RPC fails
          console.log('Falling back to edge function...');
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
            throw new Error(`Population calculation failed: ${error.message}`);
          }

          const fallbackData = fallbackResponse.data;
          if (!fallbackData || typeof fallbackData !== 'object') {
            throw new Error('Invalid response from fallback function');
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

        // Calculate included statistics (excluding specified accounts)
        const includedAccounts = accounts.filter((account) => 
          !excludedAccountNumbers.includes(account.account_number)
        );
        const includedSum = includedAccounts.reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);

        console.log('Population calculation successful:', {
          totalAccounts: accounts.length,
          includedAccounts: includedAccounts.length,
          includedSum
        });

        return {
          size: includedAccounts.length,
          sum: includedSum,
          accounts: accounts // Return all accounts, UI handles inclusion/exclusion display
        };

      } catch (error) {
        console.error('Population calculator error:', error);
        throw error;
      }
    },
    enabled: !!clientId && selectedStandardNumbers.length > 0,
    retry: (failureCount: number, error: any) => {
      // Only retry on network errors, not on business logic errors
      return failureCount < 2 && !error?.message?.includes('not found');
    }
  });
}