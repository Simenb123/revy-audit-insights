import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrialBalanceVersion {
  id: string;
  version: string;
  period_year: number;
  period_start_date: string;
  period_end_date: string;
  client_id: string;
  created_at: string;
  account_count: number;
}

export const useTrialBalanceVersions = (clientId: string) => {
  return useQuery({
    queryKey: ['trial-balance-versions', clientId],
    queryFn: async () => {
      if (!clientId) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('trial_balances')
        .select('version, period_year, period_start_date, period_end_date, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Group by version and get unique versions with metadata
      const versionMap = new Map();
      data.forEach(item => {
        if (!versionMap.has(item.version)) {
          versionMap.set(item.version, {
            id: item.version,
            version: item.version,
            period_year: item.period_year,
            period_start_date: item.period_start_date,
            period_end_date: item.period_end_date,
            client_id: clientId,
            created_at: item.created_at,
            account_count: 1
          });
        } else {
          versionMap.get(item.version).account_count++;
        }
      });

      return Array.from(versionMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!clientId,
  });
};

export const useActiveTrialBalanceVersion = (clientId: string) => {
  return useQuery({
    queryKey: ['active-trial-balance-version', clientId],
    queryFn: async () => {
      if (!clientId) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('trial_balances')
        .select('version, period_year, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data || null;
    },
    enabled: !!clientId,
  });
};