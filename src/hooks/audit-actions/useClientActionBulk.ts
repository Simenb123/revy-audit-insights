import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ActionStatus } from '@/types/audit-actions';

export function useReorderClientAuditActions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, updates }: { clientId: string; updates: { id: string; sort_order: number }[] }) => {
      if (!updates.length) return;
      const { error } = await supabase
        .from('client_audit_actions')
        .upsert(updates as any, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.clientId] });
      toast.success('Rekkefølge oppdatert');
    },
    onError: (error: any) => {
      toast.error('Kunne ikke lagre ny rekkefølge');
      console.error(error);
    }
  });
}

export function useBulkUpdateClientActionsStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, ids, status }: { clientId: string; ids: string[]; status: ActionStatus }) => {
      if (!ids.length) return;
      const { error } = await supabase
        .from('client_audit_actions')
        .update({ status })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.clientId] });
      toast.success('Status oppdatert for valgte handlinger');
    },
    onError: (error: any) => {
      toast.error('Kunne ikke oppdatere status');
      console.error(error);
    }
  });
}

export function useBulkDeleteClientActions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, ids }: { clientId: string; ids: string[] }) => {
      if (!ids.length) return;
      const { error } = await supabase
        .from('client_audit_actions')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.clientId] });
      toast.success('Valgte handlinger er slettet');
    },
    onError: (error: any) => {
      toast.error('Kunne ikke slette handlinger');
      console.error(error);
    }
  });
}
