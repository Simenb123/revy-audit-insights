import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UploadBatchStatus = 'processing' | 'completed' | 'failed' | 'queued';

export interface UploadBatch {
  id: string;
  client_id: string;
  user_id?: string;
  batch_type: string;
  file_name: string;
  file_size?: number;
  total_records: number;
  processed_records?: number;
  error_records?: number;
  status: UploadBatchStatus;
  created_at: string;
  completed_at?: string | null;
  error_log?: string | null;
}

interface UseUploadBatchesParams {
  clientId: string;
  batchType?: string;
  status?: UploadBatchStatus | 'all';
}

export function useUploadBatches({ clientId, batchType, status = 'all' }: UseUploadBatchesParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['upload-batches', clientId, batchType || 'all', status],
    queryFn: async (): Promise<UploadBatch[]> => {
      let q = supabase
        .from('upload_batches')
        .select('id, client_id, user_id, batch_type, file_name, file_size, total_records, processed_records, error_records, status, created_at, completed_at, error_log')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (batchType && batchType !== 'all') {
        q = q.eq('batch_type', batchType);
      }
      if (status && status !== 'all') {
        q = q.eq('status', status);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as UploadBatch[];
    },
    enabled: !!clientId,
  });

  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel('upload-batches-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upload_batches' }, (payload) => {
        const newClientId = (payload.new as any)?.client_id;
        const oldClientId = (payload.old as any)?.client_id;
        if (newClientId === clientId || oldClientId === clientId) {
          queryClient.invalidateQueries({ queryKey: ['upload-batches', clientId, batchType || 'all', status] });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, batchType, status, queryClient]);

  return query;
}
