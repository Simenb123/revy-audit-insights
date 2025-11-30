import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Hook to delete old client audit actions without template_id
 * Used for cleanup of hardcoded actions
 */
export function useDeleteOldClientActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { data, error } = await supabase
        .from('client_audit_actions')
        .delete()
        .eq('client_id', clientId)
        .is('template_id', null)
        .select('id, name');

      if (error) throw error;
      return data;
    },
    onSuccess: (data, clientId) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', clientId] });
      toast({
        title: 'Gamle handlinger slettet',
        description: `${data?.length || 0} utdaterte handlinger ble fjernet.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Kunne ikke slette handlinger',
        description: error?.message || 'Ukjent feil',
        variant: 'destructive',
      });
    }
  });
}
