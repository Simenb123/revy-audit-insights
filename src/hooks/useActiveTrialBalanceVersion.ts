import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveTrialBalanceVersion {
  version: string;
  year: number;
  versionId?: string;
}

/**
 * Hook for getting active trial balance version for consistent data access
 * This ensures all trial balance queries use the same version reference
 * Fixed to use actual trial balance versions (v10, v28, etc.) instead of accounting data versions
 */
export const useActiveTrialBalanceVersion = (clientId: string, fiscalYear?: number) => {
  return useQuery({
    queryKey: ['active-trial-balance-version', clientId, fiscalYear],
    queryFn: async () => {
      if (!clientId) {
        return null;
      }

      const year = fiscalYear || new Date().getFullYear();
      
      // Get the most recent trial balance version for the given client and fiscal year
      const { data, error } = await supabase
        .from('trial_balances')
        .select('version, period_year')
        .eq('client_id', clientId)
        .eq('period_year', year)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching trial balance version:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      return data[0];
    },
    select: (data): ActiveTrialBalanceVersion | null => {
      if (!data) return null;
      
      return {
        version: data.version, // This is the actual trial balance version string (v10, v28, etc.)
        year: data.period_year,
        versionId: undefined // No UUID needed for trial balance versions
      };
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

/**
 * Hook for getting trial balance data using active version automatically
 */
export const useActiveTrialBalanceData = (clientId: string, fiscalYear?: number) => {
  const { data: activeVersion } = useActiveTrialBalanceVersion(clientId, fiscalYear);

  return useQuery({
    queryKey: ['active-trial-balance-data', clientId, activeVersion?.version, activeVersion?.year],
    queryFn: async () => {
      if (!activeVersion) {
        return [];
      }

      const query = supabase
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
          is_locked,
          client_chart_of_accounts!inner(
            id,
            account_number,
            account_name,
            account_type,
            parent_account_id
          )
        `)
        .eq('client_id', clientId)
        .eq('version', activeVersion.version)
        .eq('period_year', activeVersion.year)
        .order('client_chart_of_accounts.account_number');

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId && !!activeVersion,
    staleTime: 2 * 60 * 1000, // 2 minutes cache for trial balance data
  });
};

/**
 * Helper hook to get active accounting version info (separate from trial balance versions)
 * Useful when you just need accounting version metadata
 */
export const useActiveVersionInfo = (clientId: string) => {
  return useQuery({
    queryKey: ['active-accounting-version-info', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('accounting_data_versions')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
};