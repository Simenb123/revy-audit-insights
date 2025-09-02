import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveTrialBalanceVersion } from '@/hooks/useActiveTrialBalanceVersion';
import { calculateAccountBalance } from '@/utils/transactionMapping';

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

      // Fallback: Calculate from general ledger and chart of accounts using server-side aggregation
      console.log('No direct trial balance data found, calculating from general ledger with server-side aggregation...');
      
      // Get accounts first
      const { data: accounts, error: accountsError } = await supabase
        .from('client_chart_of_accounts')
        .select('id, account_number, account_name')
        .eq('client_id', clientId);

      if (accountsError) throw accountsError;
      
      if (!accounts || accounts.length === 0) {
        console.log('No chart of accounts found');
        return [];
      }

      // Determine target version ID for aggregation
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

      // Perform server-side aggregation of general ledger transactions
      let aggregationQuery = supabase
        .from('general_ledger_transactions')
        .select(`
          client_account_id,
          sum(debit_amount)::numeric as total_debit,
          sum(credit_amount)::numeric as total_credit
        `)
        .eq('client_id', clientId)
        .not('client_account_id', 'is', null); // Only include transactions with valid account IDs

      // Apply version filter if available
      if (targetVersionId) {
        console.log('🔍 Filtering GL aggregation by version:', targetVersionId);
        aggregationQuery = aggregationQuery.eq('version_id', targetVersionId);
      } else {
        console.log('⚠️ No version available for GL aggregation filter');
      }

      // Group by client_account_id to get totals per account
      const { data: glAggregated, error: glAggError } = await aggregationQuery
        .not('client_account_id', 'is', null)
        .order('client_account_id');

      if (glAggError) {
        console.error('❌ Error in GL aggregation query:', glAggError);
        throw glAggError;
      }
        
      console.log(`Found ${accounts.length} accounts, ${glAggregated?.length || 0} aggregated GL records`);

      // Create lookup map for aggregated transaction data
      const aggregationMap = new Map<string, { total_debit: number; total_credit: number }>();
      glAggregated?.forEach((agg: any) => {
        aggregationMap.set(agg.client_account_id, {
          total_debit: Number(agg.total_debit) || 0,
          total_credit: Number(agg.total_credit) || 0
        });
      });

      // Calculate trial balance for each account using server-aggregated data
      const calculatedTrialBalance: TrialBalanceEntry[] = accounts.map(account => {
        const aggregated = aggregationMap.get(account.id) || { total_debit: 0, total_credit: 0 };
        
        const debit_turnover = aggregated.total_debit;
        const credit_turnover = aggregated.total_credit;
        
        // Calculate closing balance using the shared utility function
        const opening_balance = 0; // No opening balance data available
        const closing_balance = calculateAccountBalance(
          account.account_number,
          debit_turnover,
          credit_turnover,
          opening_balance
        );

        return {
          id: account.id,
          account_number: account.account_number,
          account_name: account.account_name,
          closing_balance,
          credit_turnover,
          debit_turnover,
          opening_balance,
          period_start_date: `${effectiveYear || new Date().getFullYear()}-01-01`,
          period_end_date: new Date().toISOString().split('T')[0],
          period_year: effectiveYear || new Date().getFullYear(),
        };
      });

      console.log(`✅ Calculated trial balance for ${calculatedTrialBalance.length} accounts using server-side aggregation`);
      console.log('Sample calculated entries:', calculatedTrialBalance.slice(0, 3).map(e => 
        `${e.account_number}: debit=${e.debit_turnover}, credit=${e.credit_turnover}, balance=${e.closing_balance}`
      ));
      
      return calculatedTrialBalance;
    },
    enabled: !!clientId, // Only require clientId - version resolution happens in queryFn
  });
};