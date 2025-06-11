
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CompleteActionParams {
  actionId: string;
  clientId: string;
  actualHours?: number;
  findings?: string;
  conclusion?: string;
}

export function useCompleteAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ actionId, clientId, actualHours, findings, conclusion }: CompleteActionParams) => {
      const updates: any = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (actualHours !== undefined) updates.actual_hours = actualHours;
      if (findings) updates.findings = findings;
      if (conclusion) updates.conclusion = conclusion;

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
      console.error('Error completing action:', error);
      toast({
        title: "Feil ved fullføring",
        description: "Kunne ikke fullføre handlingen.",
        variant: "destructive",
      });
    }
  });
}
