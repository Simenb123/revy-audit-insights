import { logger } from '@/utils/logger';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { ClientAuditAction, ActionGroup, AuditSubjectArea } from '@/types/audit-actions';
import { AuditPhase } from '@/types/revio';
import { toDbPhase, fromDbPhase } from '@/constants/auditPhases';
export {
  useAuditActionTemplates,
  useCreateAuditActionTemplate,
  useUpdateAuditActionTemplate,
  useDeleteAuditActionTemplate
} from '@/hooks/audit-actions/useActionTemplateCRUD';

export function useActionGroups() {
  return useQuery({
    queryKey: ['action-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_groups')
        .select('*')
        .order('subject_area, sort_order');

      if (error) {
        logger.error('Error fetching action groups:', error);
        throw error;
      }

      return data as ActionGroup[];
    }
  });
}

export function useClientAuditActions(clientId: string) {
  return useQuery({
    queryKey: ['client-audit-actions', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_audit_actions')
        .select('*')
        .eq('client_id', clientId)
        .order('subject_area, sort_order');

      if (error) {
        logger.error('Error fetching client audit actions:', error);
        throw error;
      }

      // Normalize phase naming for UI (e.g., 'conclusion' -> 'completion')
      const normalized = (data || []).map((a: any) => ({
        ...a,
        phase: fromDbPhase(a.phase)
      }));

      return normalized as ClientAuditAction[];
    },
    enabled: !!clientId
  });
}


export function useCreateClientAuditAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      action: Omit<ClientAuditAction, 'id' | 'created_at' | 'updated_at'>
    ) => {
      const dbAction = {
        ...action,
        subject_area: action.subject_area as any, // Type assertion for dynamic subject areas
        phase: toDbPhase(action.phase)
      };
      const { data, error } = await supabase
        .from('client_audit_actions')
        .insert(dbAction as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.client_id] });
      toast({
        title: "Handling opprettet",
        description: "Den nye handlingen er lagt til i revisjonsplanen.",
      });
    },
    onError: (error) => {
      logger.error('Error creating client audit action:', error);
      toast({
        title: "Feil ved opprettelse",
        description: "Kunne ikke opprette handlingen.",
        variant: "destructive",
      });
    }
  });
}

export function useUpdateClientAuditAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClientAuditAction> }) => {
      const dbUpdates: Database['public']['Tables']['client_audit_actions']['Update'] = {
        ...(updates as Database['public']['Tables']['client_audit_actions']['Update'])
      };
      if (updates.phase) {
        dbUpdates.phase = toDbPhase(updates.phase);
      }
      const { data, error } = await supabase
        .from('client_audit_actions')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', data.client_id] });
      toast({
        title: "Handling oppdatert",
        description: "Handlingen er oppdatert.",
      });
    },
    onError: (error) => {
      logger.error('Error updating client audit action:', error);
      toast({
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere handlingen.",
        variant: "destructive",
      });
    }
  });
}

export function useCopyActionsFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, templateIds, phase }: {
      clientId: string;
      templateIds: string[];
      phase: string;
    }) => {
      // First fetch the templates
      const { data: templates, error: templatesError } = await supabase
        .from('audit_action_templates')
        .select('*')
        .in('id', templateIds);

      if (templatesError) throw templatesError;

      // Convert templates to client actions
      const clientActions = templates.map(template => ({
        client_id: clientId,
        template_id: template.id,
        subject_area: template.subject_area,
        action_type: template.action_type,
        phase: toDbPhase(phase as AuditPhase),
        name: template.name,
        description: template.description,
        objective: template.objective,
        procedures: template.procedures,
        documentation_requirements: template.documentation_requirements,
        estimated_hours: template.estimated_hours,
        risk_level: template.risk_level,
        sort_order: template.sort_order,
        status: 'not_started' as const
      }));

      const { data, error } = await supabase
        .from('client_audit_actions')
        .insert(clientActions)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.clientId] });
      toast({
        title: "Handlinger kopiert",
        description: `${data.length} handlinger er lagt til i revisjonsplanen.`,
      });
    },
    onError: (error) => {
      logger.error('Error copying actions from template:', error);
      toast({
        title: "Feil ved kopiering",
        description: "Kunne ikke kopiere handlingene.",
        variant: "destructive",
      });
    }
  });
}

export function useApplyStandardPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, phase }: { clientId: string; phase: AuditPhase }) => {
      const phaseDb = toDbPhase(phase);

      // Import standard packages from configuration
      const { getStandardPackage } = await import('@/constants/standardPackages');
      const packageItems = getStandardPackage(phase as 'engagement' | 'planning');

      if (packageItems.length === 0) {
        throw new Error('Standardpakke er foreløpig kun tilgjengelig for Oppdragsvurdering og Planlegging.');
      }

      const clientActions = packageItems.map<Database['public']['Tables']['client_audit_actions']['Insert']>((item, idx) => ({
        client_id: clientId,
        template_id: null,
        assigned_to: null,
        reviewed_by: null,
        subject_area: item.subject_area as Database['public']['Tables']['client_audit_actions']['Insert']['subject_area'],
        action_type: item.action_type as Database['public']['Tables']['client_audit_actions']['Insert']['action_type'],
        status: 'not_started' as Database['public']['Tables']['client_audit_actions']['Insert']['status'],
        phase: phaseDb,
        sort_order: idx,
        name: item.name,
        description: item.description ?? null,
        objective: null,
        procedures: item.procedures,
        documentation_requirements: null,
        estimated_hours: null,
        risk_level: item.risk_level,
        findings: null,
        conclusion: null,
        work_notes: null,
        copied_from_client_id: null,
        copied_from_action_id: null
      }));

      const { data, error } = await supabase
        .from('client_audit_actions')
        .insert(clientActions)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.clientId] });
      toast({
        title: 'Standardpakke lagt til',
        description: `${data.length} revisjonshandlinger ble lagt til for fasen.`,
      });
    },
    onError: (error: any) => {
      logger.error('Error applying standard package:', error);
      toast({
        title: 'Kunne ikke legge til standardpakke',
        description: error?.message || 'Ukjent feil',
        variant: 'destructive'
      });
    }
  });
}

