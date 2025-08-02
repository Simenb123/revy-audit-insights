import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TBVersionOption } from '@/types/accounting';

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
        console.log('[TB Versions] No clientId provided');
        return [];
      }
      
      console.log('[TB Versions] Fetching for client:', clientId);
      
      const { data, error } = await supabase
        .from('trial_balances')
        .select('version, period_year, period_start_date, period_end_date, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[TB Versions] Error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('[TB Versions] No data found');
        return [];
      }

      console.log('[TB Versions] Raw data:', data);

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

      const result = Array.from(versionMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('[TB Versions] Processed versions:', result);
      return result;
    },
    enabled: !!clientId,
  });
};

// New hook for TB version options formatted for selectors
export const useTBVersionOptions = (clientId: string, fiscalYear?: number) => {
  return useQuery({
    queryKey: ['tb-version-options', clientId, fiscalYear],
    queryFn: async () => {
      if (!clientId) {
        console.log('[TB Version Options] No clientId provided');
        return [];
      }
      
      console.log('[TB Version Options] Fetching for client:', clientId, 'fiscal year:', fiscalYear);
      
      let query = supabase
        .from('trial_balances')
        .select('version, period_year, created_at')
        .eq('client_id', clientId);
      
      // Filter by fiscal year if provided
      if (fiscalYear) {
        query = query.eq('period_year', fiscalYear);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[TB Version Options] Error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('[TB Version Options] No data found');
        return [];
      }

      // Group by version and get unique versions
      const versionMap = new Map();
      data.forEach(item => {
        if (!versionMap.has(item.version)) {
          versionMap.set(item.version, {
            id: item.version,
            label: `${item.version} (${item.period_year})`,
            version: item.version,
            period_year: item.period_year,
            created_at: item.created_at,
            account_count: 1
          });
        } else {
          versionMap.get(item.version).account_count++;
        }
      });

      const options: TBVersionOption[] = Array.from(versionMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('[TB Version Options] Processed options:', options);
      return options;
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