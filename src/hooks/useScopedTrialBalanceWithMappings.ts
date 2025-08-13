import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useScope } from '@/contexts/ScopeContext';
import { pickLatestVersionRows, buildStandardLookups, buildMappingLookup, buildClassificationLookup, buildPrevYearMap } from './utils/trialBalanceUtils';

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

interface ScopedResult {
  trialBalanceEntries: TrialBalanceEntryWithMapping[];
}

/**
 * Aggregates Trial Balance with mappings across multiple clients based on ScopeContext.
 * If scopeType==='client', it behaves like single-client using provided clientId.
 */
export const useScopedTrialBalanceWithMappings = (
  clientIdFromWidget: string | undefined,
  fiscalYear: number,
  selectedVersion?: string
) => {
  const { scopeType, selectedClientIds } = useScope();

  const effectiveClientIds: string[] = (() => {
    if (scopeType === 'client' || !selectedClientIds?.length) {
      return clientIdFromWidget ? [clientIdFromWidget] : [];
    }
    return selectedClientIds;
  })();

  return useQuery<ScopedResult>({
    queryKey: ['scoped-trial-balance-with-mappings', effectiveClientIds.sort().join(','), fiscalYear, selectedVersion],
    enabled: effectiveClientIds.length > 0 && !!fiscalYear,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // Fetch trial balances for all clients in scope for the given year (and version if provided)
      let tbQuery = supabase
        .from('trial_balances')
        .select(`
          id,
          client_id,
          opening_balance,
          debit_turnover,
          credit_turnover,
          closing_balance,
          period_end_date,
          period_year,
          version,
          created_at,
          client_chart_of_accounts!inner(account_number, account_name)
        `)
        .in('client_id', effectiveClientIds)
        .eq('period_year', fiscalYear);

      if (selectedVersion) {
        tbQuery = tbQuery.eq('version', selectedVersion);
      }

      const { data: tbRows, error: tbErr } = await tbQuery;
      if (tbErr) throw tbErr;
      if (!tbRows || tbRows.length === 0) {
        return { trialBalanceEntries: [] };
      }

      // If version not specified, pick latest created_at per client for the year
      const filteredRows = selectedVersion ? (tbRows as any[]) : pickLatestVersionRows(tbRows as any[], 'client_id');

      // Fetch mappings and classifications across all clients in scope
      const [{ data: mappingsData, error: mapErr }, { data: classificationsData, error: classErr }, { data: standardAccounts, error: saErr }] = await Promise.all([
        supabase
          .from('trial_balance_mappings')
          .select('client_id, account_number, statement_line_number')
          .in('client_id', effectiveClientIds),
        supabase
          .from('account_classifications')
          .select('client_id, account_number, new_category')
          .in('client_id', effectiveClientIds)
          .eq('is_active', true),
        supabase
          .from('standard_accounts')
          .select('id, standard_number, standard_name, category, account_type, analysis_group')
      ]);

      if (mapErr) throw mapErr;
      if (saErr) throw saErr;
      // classifications are optional

      // Build lookups
      const stdByNumber = buildStandardLookups(standardAccounts || []);
      const mappingLookup = buildMappingLookup(mappingsData || [], stdByNumber);

      const classificationLookup = buildClassificationLookup(classificationsData || [], standardAccounts || [], mappingLookup);

      // Previous year balances per account_number per client (latest version)
      const prevYear = fiscalYear - 1;
      const { data: prevRows } = await supabase
        .from('trial_balances')
        .select('closing_balance, client_id, client_chart_of_accounts!inner(account_number), created_at, period_year')
        .in('client_id', effectiveClientIds)
        .eq('period_year', prevYear)
        .order('created_at', { ascending: false });

      const prevMap = buildPrevYearMap(prevRows || []);

      const trialBalanceEntries: TrialBalanceEntryWithMapping[] = filteredRows.map((tb: any) => {
        const acc = tb.client_chart_of_accounts;
        const accNo = acc?.account_number as string;
        const key = `${tb.client_id}|${accNo}`;
        const meta = mappingLookup.get(key) || classificationLookup.get(key);
        return {
          id: tb.id,
          account_number: accNo || 'Ukjent',
          account_name: acc?.account_name || 'Ukjent konto',
          closing_balance: tb.closing_balance || 0,
          credit_turnover: tb.credit_turnover || 0,
          debit_turnover: tb.debit_turnover || 0,
          opening_balance: tb.opening_balance || 0,
          period_end_date: tb.period_end_date,
          period_year: tb.period_year,
          previous_year_balance: prevMap.get(key) || 0,
          standard_account_id: meta?.standard_account_id,
          standard_number: meta?.standard_number,
          standard_name: meta?.standard_name,
          standard_category: meta?.standard_category,
          standard_account_type: meta?.standard_account_type,
          standard_analysis_group: meta?.standard_analysis_group,
          is_mapped: !!meta?.standard_account_id,
        } as TrialBalanceEntryWithMapping;
      });

      return { trialBalanceEntries };
    },
  });
};
