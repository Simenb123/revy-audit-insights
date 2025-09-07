import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ArBalance {
  client_id: string;
  version_id: string;
  customer_id: string;
  customer_name: string | null;
  saldo: number;
  tx_count: number;
  updated_at: string;
}

export interface ApBalance {
  client_id: string;
  version_id: string;
  supplier_id: string;
  supplier_name: string | null;
  saldo: number;
  tx_count: number;
  updated_at: string;
}

export interface ArApTotals {
  ar_total: number;
  ar_count: number;
  ap_total: number;
  ap_count: number;
}

export const useArBalances = (clientId: string, versionId?: string) => {
  return useQuery({
    queryKey: ['ar-balances', clientId, versionId],
    queryFn: async (): Promise<ArBalance[]> => {
      let query = supabase
        .from('ar_customer_balances')
        .select('*')
        .eq('client_id', clientId)
        .order('saldo', { ascending: false });

      if (versionId) {
        query = query.eq('version_id', versionId);
      } else {
        // Get active version if no version specified
        const { data: activeVersion } = await supabase
          .from('accounting_data_versions')
          .select('id')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .single();
        
        if (activeVersion) {
          query = query.eq('version_id', activeVersion.id);
        } else {
          return [];
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
};

export const useApBalances = (clientId: string, versionId?: string) => {
  return useQuery({
    queryKey: ['ap-balances', clientId, versionId],
    queryFn: async (): Promise<ApBalance[]> => {
      let query = supabase
        .from('ap_supplier_balances')
        .select('*')
        .eq('client_id', clientId)
        .order('saldo', { ascending: false });

      if (versionId) {
        query = query.eq('version_id', versionId);
      } else {
        // Get active version if no version specified
        const { data: activeVersion } = await supabase
          .from('accounting_data_versions')
          .select('id')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .single();
        
        if (activeVersion) {
          query = query.eq('version_id', activeVersion.id);
        } else {
          return [];
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
};

export const useArApTotals = (clientId: string, versionId?: string) => {
  return useQuery({
    queryKey: ['ar-ap-totals', clientId, versionId],
    queryFn: async (): Promise<ArApTotals> => {
      let actualVersionId = versionId;
      
      if (!actualVersionId) {
        // Get active version if no version specified
        const { data: activeVersion } = await supabase
          .from('accounting_data_versions')
          .select('id')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .single();
        
        if (!activeVersion) {
          return { ar_total: 0, ar_count: 0, ap_total: 0, ap_count: 0 };
        }
        actualVersionId = activeVersion.id;
      }

      // Get AR totals
      const { data: arData, error: arError } = await supabase
        .from('ar_customer_balances')
        .select('saldo')
        .eq('client_id', clientId)
        .eq('version_id', actualVersionId);
      
      if (arError) throw arError;

      // Get AP totals
      const { data: apData, error: apError } = await supabase
        .from('ap_supplier_balances')
        .select('saldo')
        .eq('client_id', clientId)
        .eq('version_id', actualVersionId);
      
      if (apError) throw apError;

      const ar_total = arData?.reduce((sum, item) => sum + (item.saldo || 0), 0) || 0;
      const ar_count = arData?.length || 0;
      const ap_total = apData?.reduce((sum, item) => sum + (item.saldo || 0), 0) || 0;
      const ap_count = apData?.length || 0;

      return { ar_total, ar_count, ap_total, ap_count };
    },
    enabled: !!clientId,
  });
};