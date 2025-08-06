import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SmartVersionInfo {
  version: string;
  period_year: number;
  created_at: string;
  account_count: number;
  accounts_with_data: number;
  total_balance_abs: number;
  is_empty: boolean;
  score: number; // Quality score for auto-selection
}

export const useSmartTrialBalanceVersions = (clientId: string) => {
  return useQuery({
    queryKey: ['smart-trial-balance-versions', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('trial_balances')
        .select(`
          version,
          period_year,
          created_at,
          opening_balance,
          debit_turnover,
          credit_turnover,
          closing_balance
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Group by version and analyze data quality
      const versionMap = new Map<string, SmartVersionInfo>();
      
      data.forEach(item => {
        const key = `${item.version}-${item.period_year}`;
        
        if (!versionMap.has(key)) {
          versionMap.set(key, {
            version: item.version,
            period_year: item.period_year,
            created_at: item.created_at,
            account_count: 0,
            accounts_with_data: 0,
            total_balance_abs: 0,
            is_empty: true,
            score: 0
          });
        }
        
        const versionInfo = versionMap.get(key)!;
        versionInfo.account_count++;
        
        // Check if account has any meaningful data
        const hasData = (
          (item.opening_balance && Math.abs(item.opening_balance) > 0.01) ||
          (item.debit_turnover && Math.abs(item.debit_turnover) > 0.01) ||
          (item.credit_turnover && Math.abs(item.credit_turnover) > 0.01) ||
          (item.closing_balance && Math.abs(item.closing_balance) > 0.01)
        );
        
        if (hasData) {
          versionInfo.accounts_with_data++;
          versionInfo.is_empty = false;
          versionInfo.total_balance_abs += Math.abs(item.closing_balance || 0);
        }
      });

      // Calculate quality scores for auto-selection
      const versions = Array.from(versionMap.values()).map(version => {
        let score = 0;
        
        // High score for versions with actual data
        if (!version.is_empty) {
          score += 100;
          
          // Bonus for high percentage of accounts with data
          const dataPercentage = version.accounts_with_data / version.account_count;
          score += dataPercentage * 50;
          
          // Bonus for higher total balance (indicates real business activity)
          if (version.total_balance_abs > 1000) score += 30;
          if (version.total_balance_abs > 100000) score += 20;
          
          // Bonus for reasonable account count (not too few, not too many empty ones)
          if (version.account_count > 50 && version.account_count < 1000) score += 10;
        }
        
        // Penalty for being too old (prefer recent data)
        const daysSinceUpload = Math.floor(
          (Date.now() - new Date(version.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceUpload > 365) score -= 20;
        if (daysSinceUpload > 180) score -= 10;
        
        return { ...version, score };
      });

      // Sort by score descending, then by created_at descending
      return versions.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    },
    enabled: !!clientId,
  });
};

export const useBestTrialBalanceVersion = (clientId: string) => {
  return useQuery({
    queryKey: ['best-trial-balance-version', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      // Manually call the smart versions query
      const { data, error } = await supabase
        .from('trial_balances')
        .select(`
          version,
          period_year,
          created_at,
          opening_balance,
          debit_turnover,
          credit_turnover,
          closing_balance
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Group by version and analyze data quality
      const versionMap = new Map<string, SmartVersionInfo>();
      
      data.forEach(item => {
        const key = `${item.version}-${item.period_year}`;
        
        if (!versionMap.has(key)) {
          versionMap.set(key, {
            version: item.version,
            period_year: item.period_year,
            created_at: item.created_at,
            account_count: 0,
            accounts_with_data: 0,
            total_balance_abs: 0,
            is_empty: true,
            score: 0
          });
        }
        
        const versionInfo = versionMap.get(key)!;
        versionInfo.account_count++;
        
        const hasData = (
          (item.opening_balance && Math.abs(item.opening_balance) > 0.01) ||
          (item.debit_turnover && Math.abs(item.debit_turnover) > 0.01) ||
          (item.credit_turnover && Math.abs(item.credit_turnover) > 0.01) ||
          (item.closing_balance && Math.abs(item.closing_balance) > 0.01)
        );
        
        if (hasData) {
          versionInfo.accounts_with_data++;
          versionInfo.is_empty = false;
          versionInfo.total_balance_abs += Math.abs(item.closing_balance || 0);
        }
      });

      // Calculate quality scores and find best version
      let bestVersion = null;
      let bestScore = 0;
      
      for (const [key, version] of versionMap) {
        let score = 0;
        
        if (!version.is_empty) {
          score += 100;
          const dataPercentage = version.accounts_with_data / version.account_count;
          score += dataPercentage * 50;
          if (version.total_balance_abs > 1000) score += 30;
          if (version.total_balance_abs > 100000) score += 20;
          if (version.account_count > 50 && version.account_count < 1000) score += 10;
        }
        
        const daysSinceUpload = Math.floor(
          (Date.now() - new Date(version.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceUpload > 365) score -= 20;
        if (daysSinceUpload > 180) score -= 10;
        
        if (score > bestScore && score > 50 && !version.is_empty) {
          bestScore = score;
          bestVersion = version;
        }
      }
      
      if (bestVersion) {
        return {
          version: bestVersion.version,
          period_year: bestVersion.period_year,
          created_at: bestVersion.created_at,
          quality_score: bestScore,
          accounts_with_data: bestVersion.accounts_with_data,
          total_accounts: bestVersion.account_count
        };
      }
      
      return null;
    },
    enabled: !!clientId,
  });
};