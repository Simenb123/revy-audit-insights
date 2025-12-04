import { logger } from '@/utils/logger';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

interface CompleteActionParams {
  actionId: string;
  clientId: string;
  actualHours?: number;
}

type ClientAuditActionUpdate = Database['public']['Tables']['client_audit_actions']['Update'];

export function useCompleteAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ actionId, clientId, actualHours }: CompleteActionParams) => {
      const updates: ClientAuditActionUpdate = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(actualHours !== undefined && { actual_hours: actualHours })
      };

      const { data, error } = await supabase
        .from('client_audit_actions')
        .update(updates)
        .eq('id', actionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.clientId] });
      toast({
        title: "Handling fullført",
        description: "Handlingen er markert som fullført.",
      });
    },
    onError: (error) => {
      logger.error('Error completing action:', error);
      toast({
        title: "Feil ved fullføring",
        description: "Kunne ikke fullføre handlingen.",
        variant: "destructive",
      });
    }
  });
}
