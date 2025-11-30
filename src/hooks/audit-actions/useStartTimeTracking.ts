import { logger } from '@/utils/logger';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StartTimeTrackingParams {
  actionId: string;
  clientId: string;
}

export function useStartTimeTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ actionId, clientId }: StartTimeTrackingParams) => {
      // Update action status to in_progress and set started timestamp
      const { data, error } = await supabase
        .from('client_audit_actions')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
          work_notes: `Startet: ${new Date().toLocaleString('no-NO')}`
        })
        .eq('id', actionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.clientId] });
      toast({
        title: "Tidregistrering startet",
        description: "Handlingen er markert som pågående.",
      });
    },
    onError: (error) => {
      logger.error('Error starting time tracking:', error);
      toast({
        title: "Feil ved start",
        description: "Kunne ikke starte tidregistrering.",
        variant: "destructive",
      });
    }
  });
}
