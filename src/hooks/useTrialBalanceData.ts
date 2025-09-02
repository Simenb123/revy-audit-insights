import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveTrialBalanceVersion } from '@/hooks/useActiveTrialBalanceVersion';

export interface TrialBalanceEntry {
  id: string;
  account_number: string;
  account_name: string;
  closing_balance: number;
  credit_turnover: number;
  debit_turnover: number;
  opening_balance: number;
  period_start_date: string;
  period_end_date: string;
  period_year: number;
  version?: string;
}

export const useTrialBalanceData = (clientId: string, version?: string, year?: number) => {
  // Get active version if no version is specified
  const { data: activeTrialBalanceVersion } = useActiveTrialBalanceVersion(clientId, year);
  
  // Use provided version or fallback to active version
  const effectiveVersion = version || activeTrialBalanceVersion?.version;
  const effectiveYear = year || activeTrialBalanceVersion?.year;

  return useQuery({
    queryKey: ['trial-balance', clientId, effectiveVersion, effectiveYear],
    queryFn: async () => {
      // First try to get data from trial_balances table with account details
      let query = supabase
        .from('trial_balances')
        .select(`
          id,
          client_id,
          client_account_id,
          opening_balance,
          debit_turnover,
          credit_turnover,
          closing_balance,
          period_start_date,
          period_end_date,
          period_year,
          version,
          client_chart_of_accounts!inner(account_number, account_name)
        `)
        .eq('client_id', clientId);

      // Add filters for version and year if available
      if (effectiveVersion) {
        query = query.eq('version', effectiveVersion);
      }
      if (effectiveYear) {
        query = query.eq('period_year', effectiveYear);
      }

      const { data: directTrialBalance, error: trialBalanceError } = await query;

      if (!trialBalanceError && directTrialBalance && directTrialBalance.length > 0) {
        console.log('✅ Found trial balance data:', directTrialBalance.length, 'accounts');
        const mappedData = directTrialBalance.map(tb => ({
          id: tb.id,
          account_number: tb.client_chart_of_accounts?.account_number || 'Ukjent',
          account_name: tb.client_chart_of_accounts?.account_name || 'Ukjent konto',
          closing_balance: tb.closing_balance || 0,
          credit_turnover: tb.credit_turnover || 0,
          debit_turnover: tb.debit_turnover || 0,
          opening_balance: tb.opening_balance || 0,
          period_start_date: tb.period_start_date || `${tb.period_year}-01-01`,
          period_end_date: tb.period_end_date,
          period_year: tb.period_year,
          version: tb.version,
        })) as TrialBalanceEntry[];
        
        // Deduplicate by account_number, keeping the most recent entry (highest id)
        const uniqueAccounts = new Map<string, TrialBalanceEntry>();
        mappedData.forEach(account => {
          const existing = uniqueAccounts.get(account.account_number);
          if (!existing || account.id > existing.id) {
            uniqueAccounts.set(account.account_number, account);
          }
        });
        
        const deduplicatedData = Array.from(uniqueAccounts.values());
        console.log('📊 Trial Balance Summary: Opening=', deduplicatedData.reduce((sum, item) => sum + item.opening_balance, 0), 'Closing=', deduplicatedData.reduce((sum, item) => sum + item.closing_balance, 0));
        console.log(`🔧 Deduplicated from ${mappedData.length} to ${deduplicatedData.length} accounts`);
        return deduplicatedData;
      }

      // Fallback: Calculate from general ledger and chart of accounts
      console.log('No direct trial balance data found, calculating from general ledger...');
      
      const { data: accounts, error: accountsError } = await supabase
        .from('client_chart_of_accounts')
        .select('*')
        .eq('client_id', clientId);

      if (accountsError) throw accountsError;

      // Get general ledger transactions for the client with version filtering
      let transactionsQuery = supabase
        .from('general_ledger_transactions')
        .select('*')
        .eq('client_id', clientId);

      // Apply version filtering - use same logic as useGeneralLedgerData
      let targetVersionId = effectiveVersion;
      if (!targetVersionId) {
        console.log('🔍 No trial balance version, finding active accounting version...');
        const { data: activeVersion, error: versionError } = await supabase
          .from('accounting_data_versions')
          .select('id')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (versionError) {
          console.error('❌ Error finding active version:', versionError);
          // Try to get the latest version instead
          const { data: latestVersion } = await supabase
            .from('accounting_data_versions')
            .select('id')
            .eq('client_id', clientId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          targetVersionId = latestVersion?.id;
          console.log('🔄 Using latest version for TB calculation:', targetVersionId);
        } else {
          targetVersionId = activeVersion?.id;
          console.log('✅ Using active version for TB calculation:', targetVersionId);
        }
      }

      // Apply version filter if we have a version
      if (targetVersionId) {
        console.log('🔍 Filtering GL transactions by version:', targetVersionId);
        
        // Use server-side aggregation instead of fetching all transactions
        const { data: glAggregated, error: glAggError } = await supabase
          .from('general_ledger_transactions')
          .select('client_account_id, sum(debit_amount) as total_debit, sum(credit_amount) as total_credit')
          .eq('client_id', clientId)
          .eq('version_id', targetVersionId);

        if (glAggError) throw glAggError;
        
        console.log('Found accounts:', accounts?.length, 'aggregated GL data:', glAggregated?.length);
        
        if (!accounts || accounts.length === 0) {
          console.log('No chart of accounts found');
          return [];
        }

        // Create lookup map for aggregated data
        const aggregationMap = new Map();
        glAggregated?.forEach((agg: any) => {
          aggregationMap.set(agg.client_account_id, {
            total_debit: Number(agg.total_debit) || 0,
            total_credit: Number(agg.total_credit) || 0
          });
        });

        // Calculate trial balance for each account using aggregated data
        const calculatedTrialBalance: TrialBalanceEntry[] = accounts.map(account => {
          const aggregated = aggregationMap.get(account.id) || { total_debit: 0, total_credit: 0 };
          
          const debit_turnover = aggregated.total_debit;
          const credit_turnover = aggregated.total_credit;
          
          console.log(`Account ${account.account_number} (${account.account_name}): debit=${debit_turnover}, credit=${credit_turnover}`);
          
          // Calculate opening and closing balance based on account type
          // For assets and expenses: debit increases balance
          // For liabilities, equity, and income: credit increases balance
          const isDebitAccount = account.account_number.startsWith('1') || account.account_number.startsWith('2') || account.account_number.startsWith('6') || account.account_number.startsWith('7');
          
          let opening_balance = 0; // Assuming no opening balance for now
          let closing_balance = 0;
          
          if (isDebitAccount) {
            closing_balance = opening_balance + debit_turnover - credit_turnover;
          } else {
            closing_balance = opening_balance + credit_turnover - debit_turnover;
          }

          const entry = {
            id: account.id,
            account_number: account.account_number,
            account_name: account.account_name,
            closing_balance,
            credit_turnover,
            debit_turnover,
            opening_balance,
            period_start_date: `${new Date().getFullYear()}-01-01`,
            period_end_date: new Date().toISOString().split('T')[0],
            period_year: new Date().getFullYear(),
          };
          
          return entry;
        });

        console.log(`Calculated trial balance for ${calculatedTrialBalance.length} accounts`);
        
        // Don't filter out accounts - show ALL accounts including those with zero balances
        // This is important for trial balance completeness
        console.log(`Returning all ${calculatedTrialBalance.length} accounts`);
        console.log('Sample entries:', calculatedTrialBalance.slice(0, 5));
        
        return calculatedTrialBalance;
      } else {
        // Use server-side aggregation even without version for better performance
        console.log('⚠️ No version available, using server-side aggregation without version filter');
        
        const { data: glAggregated, error: glAggError } = await supabase
          .from('general_ledger_transactions')
          .select('client_account_id, sum(debit_amount) as total_debit, sum(credit_amount) as total_credit')
          .eq('client_id', clientId);

        if (glAggError) throw glAggError;
        
        console.log('Found accounts:', accounts?.length, 'aggregated GL data without version:', glAggregated?.length);
        
        if (!accounts || accounts.length === 0) {
          console.log('No chart of accounts found');
          return [];
        }

        // Create lookup map for aggregated data
        const aggregationMap = new Map();
        glAggregated?.forEach((agg: any) => {
          aggregationMap.set(agg.client_account_id, {
            total_debit: Number(agg.total_debit) || 0,
            total_credit: Number(agg.total_credit) || 0
          });
        });

        // Calculate trial balance for each account using aggregated data
        const calculatedTrialBalance: TrialBalanceEntry[] = accounts.map(account => {
          const aggregated = aggregationMap.get(account.id) || { total_debit: 0, total_credit: 0 };
          
          const debit_turnover = aggregated.total_debit;
          const credit_turnover = aggregated.total_credit;
          
          console.log(`Account ${account.account_number} (${account.account_name}): debit=${debit_turnover}, credit=${credit_turnover}`);
          
          // Calculate opening and closing balance based on account type
          // For assets and expenses: debit increases balance
          // For liabilities, equity, and income: credit increases balance
          const isDebitAccount = account.account_number.startsWith('1') || account.account_number.startsWith('2') || account.account_number.startsWith('6') || account.account_number.startsWith('7');
          
          let opening_balance = 0; // Assuming no opening balance for now
          let closing_balance = 0;
          
          if (isDebitAccount) {
            closing_balance = opening_balance + debit_turnover - credit_turnover;
          } else {
            closing_balance = opening_balance + credit_turnover - debit_turnover;
          }

          const entry = {
            id: account.id,
            account_number: account.account_number,
            account_name: account.account_name,
            closing_balance,
            credit_turnover,
            debit_turnover,
            opening_balance,
            period_start_date: `${new Date().getFullYear()}-01-01`,
            period_end_date: new Date().toISOString().split('T')[0],
            period_year: new Date().getFullYear(),
          };
          
          return entry;
        });

        console.log(`Calculated trial balance for ${calculatedTrialBalance.length} accounts using server-side aggregation`);
        
        // Don't filter out accounts - show ALL accounts including those with zero balances
        // This is important for trial balance completeness
        console.log(`Returning all ${calculatedTrialBalance.length} accounts`);
        console.log('Sample entries:', calculatedTrialBalance.slice(0, 5));
        
        return calculatedTrialBalance;
      }
    },
    enabled: !!clientId, // Only require clientId - version resolution happens in queryFn
  });
};