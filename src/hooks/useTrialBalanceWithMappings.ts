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
  previous_year_balance?: number;
  standard_account_id?: string;
  standard_number?: string;
  standard_name?: string;
  standard_category?: string;
  standard_account_type?: string;
  standard_analysis_group?: string;
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
      // Auto-detect best version if none specified
      let finalVersion = selectedVersion;
      let finalYear = fiscalYear || 2024;
      
      if (!selectedVersion || !fiscalYear) {
        // Find the best version with actual data
        const { data: versionData } = await supabase
          .from('trial_balances')
          .select('version, period_year, created_at, closing_balance')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        if (versionData && versionData.length > 0) {
          // Group by version and calculate data quality
          const versionMap = new Map();
          versionData.forEach(item => {
            const key = `${item.version}-${item.period_year}`;
            if (!versionMap.has(key)) {
              versionMap.set(key, {
                version: item.version,
                period_year: item.period_year,
                created_at: item.created_at,
                accounts_with_data: 0,
                total_accounts: 0
              });
            }
            const versionInfo = versionMap.get(key);
            versionInfo.total_accounts++;
            if (item.closing_balance && Math.abs(item.closing_balance) > 0.01) {
              versionInfo.accounts_with_data++;
            }
          });

          // Find best version (highest ratio of accounts with data)
          let bestVersion = null;
          let bestScore = 0;
          for (const [key, info] of versionMap) {
            const score = info.accounts_with_data / info.total_accounts;
            if (score > bestScore && info.accounts_with_data > 10) {
              bestScore = score;
              bestVersion = info;
            }
          }

          if (bestVersion) {
            finalVersion = finalVersion || bestVersion.version;
            finalYear = fiscalYear || bestVersion.period_year;
          }
        }
      }

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
        .eq('period_year', finalYear);

      // Filter by selected version if provided
      if (finalVersion) {
        trialBalanceQuery = trialBalanceQuery.eq('version', finalVersion);
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
        console.error('Error fetching account classifications:', classificationsError);
        // Don't throw error for classifications - continue without them
        console.warn('Continuing without account classifications:', classificationsError);
      }

      // Get standard accounts to map by statement_line_number
      const { data: standardAccounts, error: standardError } = await supabase
        .from('standard_accounts')
        .select('id, standard_number, standard_name, category, account_type, analysis_group');

      // Prepare previous year balance lookup (latest version of previous year)
      const previousYear = finalYear - 1;
      let prevVersion: string | null = null;
      try {
        const { data: prevLatest } = await supabase
          .from('trial_balances')
          .select('version, created_at')
          .eq('client_id', clientId)
          .eq('period_year', previousYear)
          .order('created_at', { ascending: false })
          .limit(1);
        if (prevLatest && prevLatest.length > 0) {
          prevVersion = (prevLatest[0] as any).version as string;
        }
      } catch (e) {
        console.warn('Could not determine previous year version', e);
      }

      let prevQuery = supabase
        .from('trial_balances')
        .select(`
          closing_balance,
          client_chart_of_accounts!inner(account_number)
        `)
        .eq('client_id', clientId)
        .eq('period_year', previousYear);
      if (prevVersion) {
        prevQuery = prevQuery.eq('version', prevVersion);
      }
      const { data: prevData, error: prevErr } = await prevQuery;
      if (prevErr) {
        console.warn('Previous year fetch error (non-fatal):', prevErr);
      }
      const prevMap = new Map<string, number>();
      prevData?.forEach((row: any) => {
        const accNo = row?.client_chart_of_accounts?.account_number;
        if (accNo) prevMap.set(accNo, row.closing_balance || 0);
      });
      const mappingLookup = new Map();
      mappingsData?.forEach(mapping => {
        // Find standard account by matching statement_line_number with standard_number
        const standardAccount = standardAccounts?.find(sa => sa.standard_number === mapping.statement_line_number);
        
        if (standardAccount) {
          mappingLookup.set(mapping.account_number, {
            standard_account_id: standardAccount.id,
            standard_number: standardAccount.standard_number,
            standard_name: standardAccount.standard_name,
            standard_category: standardAccount.category,
            standard_account_type: standardAccount.account_type,
            standard_analysis_group: standardAccount.analysis_group,
          });
        }
      });

      // Create a classification lookup as fallback (only for accounts not in mappingLookup)
      const classificationLookup = new Map();
      classificationsData?.forEach(classification => {
        // Skip if already mapped via trial_balance_mappings
        if (mappingLookup.has(classification.account_number)) {
          return;
        }
        
        // Find standard account by matching new_category with standard_name
        const standardAccount = standardAccounts?.find(sa => sa.standard_name === classification.new_category);
        
        if (standardAccount) {
          classificationLookup.set(classification.account_number, {
            standard_account_id: standardAccount.id,
            standard_number: standardAccount.standard_number,
            standard_name: standardAccount.standard_name,
            standard_category: standardAccount.category,
            standard_account_type: standardAccount.account_type,
            standard_analysis_group: standardAccount.analysis_group,
          });
        }
      });

      // Transform the data
      const trialBalanceEntries: TrialBalanceEntryWithMapping[] = trialBalanceData.map(tb => {
        const account = (tb as any).client_chart_of_accounts;
        const accNo = account?.account_number;
        
        // Use mapping first, then fallback to classification
        const mapping = mappingLookup.get(accNo) || classificationLookup.get(accNo);

        return {
          id: (tb as any).id,
          account_number: accNo || 'Ukjent',
          account_name: account?.account_name || 'Ukjent konto',
          closing_balance: (tb as any).closing_balance || 0,
          credit_turnover: (tb as any).credit_turnover || 0,
          debit_turnover: (tb as any).debit_turnover || 0,
          opening_balance: (tb as any).opening_balance || 0,
          period_end_date: (tb as any).period_end_date,
          period_year: (tb as any).period_year,
          previous_year_balance: prevMap.get(accNo) || 0,
          standard_account_id: mapping?.standard_account_id,
          standard_number: mapping?.standard_number,
          standard_name: mapping?.standard_name,
          standard_category: mapping?.standard_category,
          standard_account_type: mapping?.standard_account_type,
          standard_analysis_group: mapping?.standard_analysis_group,
          is_mapped: !!mapping?.standard_account_id,
        } as TrialBalanceEntryWithMapping;
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
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
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