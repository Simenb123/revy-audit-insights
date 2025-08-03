import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrialBalanceEntryWithMapping {
  id: string;
  account_number: string;
  account_name: string;
  closing_balance: number;
  credit_turnover: number;
  debit_turnover: number;
  opening_balance: number;
  period_end_date: string;
  period_year: number;
  standard_account_id?: string;
  standard_number?: string;
  standard_name?: string;
  is_mapped: boolean;
}

export interface StandardAccountBalance {
  standard_account_id: string;
  standard_number: string;
  standard_name: string;
  total_balance: number;
  mapped_accounts: TrialBalanceEntryWithMapping[];
}

export const useTrialBalanceWithMappings = (clientId: string, fiscalYear?: number, selectedVersion?: string) => {
  return useQuery({
    queryKey: ['trial-balance-with-mappings', clientId, fiscalYear, selectedVersion],
    queryFn: async () => {
      // Get trial balance data
      let trialBalanceQuery = supabase
        .from('trial_balances')
        .select(`
          id,
          client_id,
          client_account_id,
          opening_balance,
          debit_turnover,
          credit_turnover,
          closing_balance,
          period_end_date,
          period_year,
          version,
          client_chart_of_accounts!inner(
            account_number, 
            account_name
          )
        `)
        .eq('client_id', clientId)
        .eq('period_year', fiscalYear || new Date().getFullYear());

      // Filter by selected version if provided
      if (selectedVersion) {
        trialBalanceQuery = trialBalanceQuery.eq('version', selectedVersion);
      }

      const { data: trialBalanceData, error: tbError } = await trialBalanceQuery;

      if (tbError) {
        console.error('Error fetching trial balance:', tbError);
        throw tbError;
      }

      if (!trialBalanceData || trialBalanceData.length === 0) {
        // Return empty result if no trial balance data exists for the selected version/year
        return {
          trialBalanceEntries: [],
          standardAccountBalances: [],
          mappingStats: {
            totalAccounts: 0,
            mappedAccounts: 0,
            unmappedAccounts: 0,
          }
        };
      }

      // Get trial balance mappings for this client
      const { data: mappingsData, error: mappingsError } = await supabase
        .from('trial_balance_mappings')
        .select('account_number, statement_line_number')
        .eq('client_id', clientId);

      if (mappingsError) {
        console.error('Error fetching trial balance mappings:', mappingsError);
        throw mappingsError;
      }

      // Get standard accounts to map by statement_line_number
      const { data: standardAccounts, error: standardError } = await supabase
        .from('standard_accounts')
        .select('id, standard_number, standard_name');

      if (standardError) {
        console.error('Error fetching standard accounts:', standardError);
        throw standardError;
      }

      // Create a mapping lookup by account number
      const mappingLookup = new Map();
      mappingsData?.forEach(mapping => {
        // Find standard account by matching statement_line_number with standard_number
        const standardAccount = standardAccounts?.find(sa => sa.standard_number === mapping.statement_line_number);
        
        if (standardAccount) {
          mappingLookup.set(mapping.account_number, {
            standard_account_id: standardAccount.id,
            standard_number: standardAccount.standard_number,
            standard_name: standardAccount.standard_name,
          });
        }
      });

      // Transform the data
      const trialBalanceEntries: TrialBalanceEntryWithMapping[] = trialBalanceData.map(tb => {
        const account = tb.client_chart_of_accounts;
        const mapping = mappingLookup.get(account?.account_number);

        return {
          id: tb.id,
          account_number: account?.account_number || 'Ukjent',
          account_name: account?.account_name || 'Ukjent konto',
          closing_balance: tb.closing_balance || 0,
          credit_turnover: tb.credit_turnover || 0,
          debit_turnover: tb.debit_turnover || 0,
          opening_balance: tb.opening_balance || 0,
          period_end_date: tb.period_end_date,
          period_year: tb.period_year,
          standard_account_id: mapping?.standard_account_id,
          standard_number: mapping?.standard_number,
          standard_name: mapping?.standard_name,
          is_mapped: !!mapping?.standard_account_id,
        };
      });

      // Group by standard accounts and calculate totals
      const standardAccountBalances = groupByStandardAccounts(trialBalanceEntries);

      return {
        trialBalanceEntries,
        standardAccountBalances,
        mappingStats: {
          totalAccounts: trialBalanceEntries.length,
          mappedAccounts: trialBalanceEntries.filter(tb => tb.is_mapped).length,
          unmappedAccounts: trialBalanceEntries.filter(tb => !tb.is_mapped).length,
        }
      };
    },
    enabled: !!clientId,
  });
};

async function calculateTrialBalanceWithMappings(clientId: string) {
  // Get chart of accounts with their mappings
  const { data: accounts, error: accountsError } = await supabase
    .from('client_chart_of_accounts')
    .select(`
      *,
      account_mappings(
        standard_account_id,
        standard_account:standard_accounts(
          standard_number,
          standard_name
        )
      )
    `)
    .eq('client_id', clientId);

  if (accountsError) throw accountsError;

  // Get all general ledger transactions
  const { data: transactions, error: transactionsError } = await supabase
    .from('general_ledger_transactions')
    .select('*')
    .eq('client_id', clientId);

  if (transactionsError) throw transactionsError;

  if (!accounts || accounts.length === 0) {
    return {
      trialBalanceEntries: [],
      standardAccountBalances: [],
      mappingStats: { totalAccounts: 0, mappedAccounts: 0, unmappedAccounts: 0 }
    };
  }

  // Calculate trial balance for each account
  const trialBalanceEntries: TrialBalanceEntryWithMapping[] = accounts.map(account => {
    const accountTransactions = transactions?.filter(t => t.client_account_id === account.id) || [];
    
    const debit_turnover = accountTransactions.reduce((sum, t) => {
      if (t.debit_amount !== null && t.debit_amount !== undefined) return sum + t.debit_amount;
      if (t.balance_amount !== null && t.balance_amount > 0) return sum + t.balance_amount;
      return sum;
    }, 0);
    
    const credit_turnover = accountTransactions.reduce((sum, t) => {
      if (t.credit_amount !== null && t.credit_amount !== undefined) return sum + t.credit_amount;
      if (t.balance_amount !== null && t.balance_amount < 0) return sum + Math.abs(t.balance_amount);
      return sum;
    }, 0);
    
    // Calculate closing balance based on account type
    const isDebitAccount = account.account_number.startsWith('1') || account.account_number.startsWith('2') || account.account_number.startsWith('6') || account.account_number.startsWith('7');
    const opening_balance = 0;
    const closing_balance = isDebitAccount 
      ? opening_balance + debit_turnover - credit_turnover
      : opening_balance + credit_turnover - debit_turnover;

    const mapping = account.account_mappings?.[0];
    const standardAccount = mapping?.standard_account;

    return {
      id: account.id,
      account_number: account.account_number,
      account_name: account.account_name,
      closing_balance,
      credit_turnover,
      debit_turnover,
      opening_balance,
      period_end_date: new Date().toISOString().split('T')[0],
      period_year: new Date().getFullYear(),
      standard_account_id: mapping?.standard_account_id,
      standard_number: standardAccount?.standard_number,
      standard_name: standardAccount?.standard_name,
      is_mapped: !!mapping?.standard_account_id,
    };
  });

  const standardAccountBalances = groupByStandardAccounts(trialBalanceEntries);

  return {
    trialBalanceEntries,
    standardAccountBalances,
    mappingStats: {
      totalAccounts: trialBalanceEntries.length,
      mappedAccounts: trialBalanceEntries.filter(tb => tb.is_mapped).length,
      unmappedAccounts: trialBalanceEntries.filter(tb => !tb.is_mapped).length,
    }
  };
}

function groupByStandardAccounts(trialBalanceEntries: TrialBalanceEntryWithMapping[]): StandardAccountBalance[] {
  const standardAccountsMap = new Map<string, StandardAccountBalance>();

  trialBalanceEntries.forEach(entry => {
    if (!entry.is_mapped || !entry.standard_account_id) return;

    const key = entry.standard_account_id;
    
    if (!standardAccountsMap.has(key)) {
      standardAccountsMap.set(key, {
        standard_account_id: entry.standard_account_id,
        standard_number: entry.standard_number || '',
        standard_name: entry.standard_name || '',
        total_balance: 0,
        mapped_accounts: [],
      });
    }

    const standardAccount = standardAccountsMap.get(key)!;
    standardAccount.total_balance += entry.closing_balance;
    standardAccount.mapped_accounts.push(entry);
  });

  return Array.from(standardAccountsMap.values()).sort((a, b) => 
    a.standard_number.localeCompare(b.standard_number)
  );
}

export const getStandardAccountBalance = (
  standardAccountBalances: StandardAccountBalance[], 
  standardNumber: string
): number => {
  const account = standardAccountBalances.find(acc => acc.standard_number === standardNumber);
  return account?.total_balance || 0;
};