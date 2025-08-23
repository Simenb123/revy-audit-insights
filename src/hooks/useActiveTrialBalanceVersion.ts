import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveVersion } from '@/hooks/useAccountingVersions';

export interface ActiveTrialBalanceVersion {
  version: string;
  year: number;
  versionId?: string;
}

/**
 * Hook for getting active trial balance version for consistent data access
 * This ensures all trial balance queries use the same version reference
 */
export const useActiveTrialBalanceVersion = (clientId: string, fiscalYear?: number) => {
  // Get active accounting data version
  const { data: activeAccountingVersion } = useActiveVersion(clientId);

  return useQuery({
    queryKey: ['active-trial-balance-version', clientId, fiscalYear, activeAccountingVersion?.id],
    queryFn: async (): Promise<ActiveTrialBalanceVersion | null> => {
      if (!activeAccountingVersion) {
        return null;
      }

      // For trial balance, we use the file_name as version and the fiscal year
      const version = activeAccountingVersion.file_name || `Version ${activeAccountingVersion.version_number}`;
      const year = fiscalYear || new Date().getFullYear();

      return {
        version,
        year,
        versionId: activeAccountingVersion.id
      };
    },
    enabled: !!clientId && !!activeAccountingVersion,
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
 * Helper hook to get active version info without data
 * Useful when you just need version metadata
 */
export const useActiveVersionInfo = (clientId: string) => {
  const { data: activeVersion } = useActiveVersion(clientId);
  
  return {
    isLoading: !activeVersion,
    version: activeVersion,
    versionId: activeVersion?.id,
    versionNumber: activeVersion?.version_number,
    fileName: activeVersion?.file_name,
    isActive: activeVersion?.is_active || false
  };
};