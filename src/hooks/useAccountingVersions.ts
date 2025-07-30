import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GLVersionOption } from '@/types/accounting';

export interface AccountingDataVersion {
  id: string;
  client_id: string;
  version_number: number;
  file_name: string;
  upload_batch_id: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  is_active: boolean;
  total_transactions: number;
  total_debit_amount: number;
  total_credit_amount: number;
  balance_difference: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useAccountingVersions = (clientId: string) => {
  return useQuery({
    queryKey: ['accounting-versions', clientId],
    queryFn: async () => {
      console.log('[GL Versions] Fetching for client:', clientId);
      
      const { data, error } = await supabase
        .from('accounting_data_versions')
        .select('*')
        .eq('client_id', clientId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('[GL Versions] Error:', error);
        throw error;
      }
      
      console.log('[GL Versions] Raw data:', data);
      return data as AccountingDataVersion[];
    },
    enabled: !!clientId,
  });
};

// New hook for version options formatted for selectors
export const useGLVersionOptions = (clientId: string) => {
  return useQuery({
    queryKey: ['gl-version-options', clientId],
    queryFn: async () => {
      console.log('[GL Version Options] Fetching for client:', clientId);
      
      const { data, error } = await supabase
        .from('accounting_data_versions')
        .select('id, version_number, file_name, is_active, created_at, total_transactions')
        .eq('client_id', clientId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('[GL Version Options] Error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('[GL Version Options] No data found');
        return [];
      }

      const options: GLVersionOption[] = data.map(version => ({
        id: version.id,
        label: `Versjon ${version.version_number} - ${version.file_name}`,
        version_number: version.version_number,
        file_name: version.file_name,
        is_active: version.is_active,
        created_at: version.created_at,
        total_transactions: version.total_transactions
      }));

      console.log('[GL Version Options] Processed options:', options);
      return options;
    },
    enabled: !!clientId,
  });
};

export const useActiveVersion = (clientId: string) => {
  return useQuery({
    queryKey: ['active-version', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounting_data_versions')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as AccountingDataVersion | null;
    },
    enabled: !!clientId,
  });
};

export const useSetActiveVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase.rpc('set_active_version', {
        p_version_id: versionId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-versions'] });
      queryClient.invalidateQueries({ queryKey: ['active-version'] });
      queryClient.invalidateQueries({ queryKey: ['general-ledger-v4'] });
    },
  });
};

export const useCreateVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      clientId: string;
      fileName: string;
      uploadBatchId?: string;
      totalTransactions: number;
      totalDebitAmount: number;
      totalCreditAmount: number;
      balanceDifference: number;
      metadata?: any;
    }) => {
      // Get next version number
      const { data: nextVersionNumber, error: versionError } = await supabase.rpc(
        'get_next_version_number',
        { p_client_id: params.clientId }
      );

      if (versionError) throw versionError;

      // Create new version
      const { data, error } = await supabase
        .from('accounting_data_versions')
        .insert({
          client_id: params.clientId,
          version_number: nextVersionNumber,
          file_name: params.fileName,
          upload_batch_id: params.uploadBatchId,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          total_transactions: params.totalTransactions,
          total_debit_amount: params.totalDebitAmount,
          total_credit_amount: params.totalCreditAmount,
          balance_difference: params.balanceDifference,
          metadata: params.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      // Set this version as active
      const { error: setActiveError } = await supabase.rpc('set_active_version', {
        p_version_id: data.id
      });

      if (setActiveError) throw setActiveError;

      return data as AccountingDataVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-versions'] });
      queryClient.invalidateQueries({ queryKey: ['active-version'] });
    },
  });
};