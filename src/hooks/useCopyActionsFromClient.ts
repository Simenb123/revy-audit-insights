import { logger } from '@/utils/logger';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ClientAuditAction } from '@/types/audit-actions';
import { AuditPhase } from '@/types/revio';
import { toDbPhase } from '@/constants/auditPhases';

interface CopyActionsFromClientParams {
  targetClientId: string;
  sourceClientId: string;
  actionIds: string[];
  phase: string;
}

export function useCopyActionsFromClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetClientId, sourceClientId, actionIds, phase }: CopyActionsFromClientParams) => {
      // First fetch the source actions
      const { data: sourceActions, error: fetchError } = await supabase
        .from('client_audit_actions')
        .select('*')
        .eq('client_id', sourceClientId)
        .in('id', actionIds);

      if (fetchError) throw fetchError;

      // Convert source actions to new client actions
      const newActions = sourceActions.map(action => ({
        client_id: targetClientId,
        template_id: action.template_id,
        subject_area: action.subject_area,
        action_type: action.action_type,
        phase: toDbPhase(phase as AuditPhase),
        name: action.name,
        description: action.description,
        objective: action.objective,
        procedures: action.procedures,
        documentation_requirements: action.documentation_requirements,
        estimated_hours: action.estimated_hours,
        risk_level: action.risk_level,
        sort_order: action.sort_order,
        status: 'not_started' as const,
        copied_from_client_id: sourceClientId,
        copied_from_action_id: action.id
      }));

      const { data, error } = await supabase
        .from('client_audit_actions')
        .insert(newActions)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.targetClientId] });
      toast({
        title: "Handlinger kopiert",
        description: `${data.length} handlinger er kopiert fra annen klient.`,
      });
    },
    onError: (error) => {
      logger.error('Error copying actions from client:', error);
      toast({
        title: "Feil ved kopiering",
        description: "Kunne ikke kopiere handlingene fra annen klient.",
        variant: "destructive",
      });
    }
  });
}
