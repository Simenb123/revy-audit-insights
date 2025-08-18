import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteAccountingVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      console.log('[Delete Version] Deleting version:', versionId);
      
      // First delete related general ledger transactions
      const { error: transactionsError } = await supabase
        .from('general_ledger_transactions')
        .delete()
        .eq('version_id', versionId);

      if (transactionsError) {
        throw new Error(`Failed to delete transactions: ${transactionsError.message}`);
      }

      // Then delete the version record
      const { error: versionError } = await supabase
        .from('accounting_data_versions')
        .delete()
        .eq('id', versionId);

      if (versionError) {
        throw new Error(`Failed to delete version: ${versionError.message}`);
      }

      console.log('[Delete Version] Successfully deleted version:', versionId);
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['accounting-versions'] });
      queryClient.invalidateQueries({ queryKey: ['available-versions'] });
      queryClient.invalidateQueries({ queryKey: ['gl-version-options'] });
      queryClient.invalidateQueries({ queryKey: ['general-ledger-v6'] });
      queryClient.invalidateQueries({ queryKey: ['general-ledger-count-v6'] });
      queryClient.invalidateQueries({ queryKey: ['active-version'] });
      
      toast.success('Hovedboksversjon slettet');
    },
    onError: (error: Error) => {
      console.error('[Delete Version] Error:', error);
      toast.error(`Kunne ikke slette versjon: ${error.message}`);
    },
  });
};