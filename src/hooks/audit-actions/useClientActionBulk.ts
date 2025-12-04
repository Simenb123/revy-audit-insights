import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ActionStatus } from '@/types/audit-actions';

interface MutationError {
  message: string;
}

interface ReorderUpdate {
  id: string;
  sort_order: number;
}

/**
 * Hook for reordering client audit actions via drag-and-drop.
 * Updates the sort_order field for multiple actions at once.
 * 
 * @example
 * ```tsx
 * const { mutate: reorder } = useReorderClientAuditActions();
 * reorder({
 *   clientId: 'client-id',
 *   updates: [
 *     { id: 'action-1', sort_order: 0 },
 *     { id: 'action-2', sort_order: 1 }
 *   ]
 * });
 * ```
 */
export function useReorderClientAuditActions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, updates }: { clientId: string; updates: ReorderUpdate[] }) => {
      if (!updates.length) return;
      // Update each action's sort_order individually
      const updatePromises = updates.map(({ id, sort_order }) =>
        supabase
          .from('client_audit_actions')
          .update({ sort_order })
          .eq('id', id)
      );
      const results = await Promise.all(updatePromises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.clientId] });
      toast.success('Rekkefølge oppdatert');
    },
    onError: (error: MutationError) => {
      toast.error('Kunne ikke lagre ny rekkefølge');
      console.error(error);
    }
  });
}

/**
 * Hook for bulk updating the status of multiple audit actions.
 * 
 * @example
 * ```tsx
 * const { mutate: bulkUpdateStatus } = useBulkUpdateClientActionsStatus();
 * bulkUpdateStatus({
 *   clientId: 'client-id',
 *   ids: ['action-1', 'action-2'],
 *   status: 'completed'
 * });
 * ```
 */
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
    onError: (error: MutationError) => {
      toast.error('Kunne ikke oppdatere status');
      console.error(error);
    }
  });
}

/**
 * Hook for bulk deleting multiple audit actions.
 * 
 * @example
 * ```tsx
 * const { mutate: bulkDelete } = useBulkDeleteClientActions();
 * bulkDelete({
 *   clientId: 'client-id',
 *   ids: ['action-1', 'action-2']
 * });
 * ```
 */
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
    onError: (error: MutationError) => {
      toast.error('Kunne ikke slette handlinger');
      console.error(error);
    }
  });
}
