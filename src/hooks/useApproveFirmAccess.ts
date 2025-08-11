
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import type { UserRole } from '@/types/organization';

export function useApproveFirmAccess() {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, assignRole }: { requestId: string; assignRole: UserRole }) => {
      const { data, error } = await supabase.rpc('approve_firm_access_request', {
        p_request_id: requestId,
        p_assign_role: assignRole,
      });
      if (error) {
        logger.error('Approve request failed', error);
        throw error;
      }
      return data as boolean;
    },
    onSuccess: () => {
      toast({ title: 'Forespørsel godkjent', description: 'Brukeren er lagt til i firmaet.' });
      qc.invalidateQueries({ queryKey: ['firmAccessRequests'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Kunne ikke godkjenne',
        description: error?.message ?? 'Ukjent feil',
        variant: 'destructive',
      });
    },
  });
}
