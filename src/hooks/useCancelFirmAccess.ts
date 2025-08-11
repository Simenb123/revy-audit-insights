
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export function useCancelFirmAccess() {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const { data, error } = await supabase.rpc('cancel_my_firm_access_request', {
        p_request_id: requestId,
      });
      if (error) {
        logger.error('Cancel request failed', error);
        throw error;
      }
      return data as boolean;
    },
    onSuccess: () => {
      toast({ title: 'Forespørsel kansellert' });
      qc.invalidateQueries({ queryKey: ['firmAccessRequests'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Kunne ikke kansellere',
        description: error?.message ?? 'Ukjent feil',
        variant: 'destructive',
      });
    },
  });
}
