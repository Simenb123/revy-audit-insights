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

      // Create empty trial balance to avoid crashing - do not attempt fallback calculation
      console.log('No direct trial balance data found, returning empty array');
      return [];
    },
    enabled: !!clientId, // Only require clientId - version resolution happens in queryFn
  });
};