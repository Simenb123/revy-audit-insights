import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeleteClientActionParams {
  actionId: string;
  clientId: string;
}

/**
 * Hook for deleting a single client audit action.
 * 
 * @example
 * ```tsx
 * const { mutate: deleteAction } = useDeleteClientAction();
 * deleteAction({ actionId: 'xxx', clientId: 'yyy' });
 * ```
 * 
 * @returns A mutation hook with loading states and mutate function
 */
export const useDeleteClientAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ actionId }: DeleteClientActionParams) => {
      const { error } = await supabase
        .from('client_audit_actions')
        .delete()
        .eq('id', actionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['client-audit-actions', variables.clientId] 
      });
      toast.success('Handling slettet');
    },
    onError: (error) => {
      console.error('Failed to delete action:', error);
      toast.error('Kunne ikke slette handling');
    },
  });
};
