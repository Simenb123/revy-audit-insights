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

      // Get trial balance mappings for this client - prioritize these over classifications
      const { data: mappingsData, error: mappingsError } = await supabase
        .from('trial_balance_mappings')
        .select('account_number, statement_line_number')
        .eq('client_id', clientId);

      if (mappingsError) {
        console.error('Error fetching trial balance mappings:', mappingsError);
        throw mappingsError;
      }

      // Get account classifications as fallback (only if no mapping exists)
      const { data: classificationsData, error: classificationsError } = await supabase
        .from('account_classifications')
        .select('account_number, new_category')
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (classificationsError) {
        console.warn('Error fetching account classifications:', classificationsError);
      }

      // Get standard accounts to map by statement_line_number
      const { data: standardAccounts, error: standardError } = await supabase
        .from('standard_accounts')
        .select('id, standard_number, standard_name');

      if (standardError) {
        console.error('Error fetching standard accounts:', standardError);
        throw standardError;
      }

      // Build mapping lookup - prioritize direct mappings
      const mappingLookup = new Map<string, string>();
      (mappingsData as any[])?.forEach((mapping: any) => {
        // Find standard account by matching statement_line_number with standard_number
        const standardAccount = (standardAccounts as any[])?.find(sa => sa.standard_number === mapping.statement_line_number);
        if (standardAccount) {
          mappingLookup.set(mapping.account_number, standardAccount.standard_number);
        }
      });

      // Create a classification lookup as fallback (only for accounts not in mappingLookup)
      const classificationLookup = new Map<string, string>();
      (classificationsData as any[])?.forEach((classification: any) => {
        // Skip if already mapped via trial_balance_mappings
        if (mappingLookup.has(classification.account_number)) {
          return;
        }
        
        // Find standard account by matching new_category with standard_name
        const standardAccount = (standardAccounts as any[])?.find(sa => sa.standard_name === classification.new_category);
        if (standardAccount) {
          classificationLookup.set(classification.account_number, standardAccount.standard_number);
        }
      });

      // Get all account numbers that map to selected standard numbers
      const relevantAccountNumbers = new Set<string>();
      
      // Check mappings
      for (const [accountNumber, standardNumber] of mappingLookup.entries()) {
        if (selectedStandardNumbers.includes(standardNumber)) {
          relevantAccountNumbers.add(accountNumber);
        }
      }
      
      // Check classifications (fallback)
      for (const [accountNumber, standardNumber] of classificationLookup.entries()) {
        if (selectedStandardNumbers.includes(standardNumber)) {
          relevantAccountNumbers.add(accountNumber);
        }
      }

      // If no accounts are mapped to selected standards, return empty result
      if (relevantAccountNumbers.size === 0) {
        return {
          size: 0,
          sum: 0,
          accounts: []
        };
      }

      // Get trial balance data for relevant accounts
      let query = supabase
        .from('trial_balances')
        .select(`
          closing_balance, 
          client_account_id,
          client_chart_of_accounts!inner(
            account_number, 
            account_name
          )
        `)
        .eq('client_id', clientId)
        .eq('period_year', fiscalYear)
        .neq('closing_balance', 0);

      // Filter by version if provided
      if (versionId) {
        query = query.eq('version', versionId);
      }

      const { data: trialBalanceData, error } = await query;

      if (error) throw error;

      // Filter to only include accounts that are mapped to selected standard numbers
      const accounts = (trialBalanceData as any[])
        ?.filter(tb => {
          const accountNumber = tb.client_chart_of_accounts?.account_number;
          return accountNumber && relevantAccountNumbers.has(accountNumber);
        })
        .map(tb => {
          const account = tb.client_chart_of_accounts;
          return {
            account_number: account.account_number,
            account_name: account.account_name || 'Ukjent konto',
            closing_balance: tb.closing_balance || 0,
            transaction_count: 0 // Will be implemented later
          };
        })
        || [];

      const totalSum = accounts.reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);
      
      // Filter for included accounts (not excluded) for statistics only
      const includedAccounts = accounts.filter(account => 
        !excludedAccountNumbers.includes(account.account_number)
      );
      const includedSum = includedAccounts.reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);

      return {
        size: includedAccounts.length, // Statistics based on included accounts only
        sum: includedSum,
        accounts: accounts // Return all accounts, UI handles inclusion/exclusion display
      };
    },
    enabled: !!clientId
  });
}