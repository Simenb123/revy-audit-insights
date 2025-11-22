import { logger } from '@/utils/logger';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import type { AuditActionTemplate, AuditSubjectArea } from '@/types/audit-actions';
import { toDbPhase, fromDbPhase } from '@/constants/auditPhases';
import type { AuditPhase } from '@/types/revio';

export function useAuditActionTemplates(subjectArea?: AuditSubjectArea) {
  return useQuery({
    queryKey: ['audit-action-templates', subjectArea],
    queryFn: async () => {
      let query = supabase
        .from('audit_action_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order, name');

      if (subjectArea) {
        // Query by subject_area_id if it's a UUID, otherwise use legacy subject_area
        if (subjectArea.includes('-')) {
          query = query.eq('subject_area_id', subjectArea);
        } else {
          query = query.eq('subject_area', subjectArea as any);
        }
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }
      const normalized = (data || []).map((t: any) => ({
        ...t,
        applicable_phases: (t.applicable_phases || []).map((p: any) => fromDbPhase(p))
      }));
      return normalized as AuditActionTemplate[];
    }
  });
}

export function useCreateAuditActionTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: Omit<AuditActionTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      // Map AuditPhase values to database enum values
      const mappedPhases = templateData.applicable_phases.map(phase => 
        toDbPhase(phase as AuditPhase)
      );

      const dataToInsert = {
        ...templateData,
        subject_area: templateData.subject_area as any, // Type assertion for dynamic subject areas
        applicable_phases: mappedPhases as Database['public']['Enums']['audit_phase'][]
      };

      const { data, error } = await supabase
        .from('audit_action_templates')
        .insert(dataToInsert as any)
        .select()
        .single();

      if (error) {
        logger.error('Error creating audit action template:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-action-templates'] });
      toast.success('Handlingsmal opprettet');
    },
    onError: (error: any) => {
      logger.error('Failed to create audit action template:', error);
      toast.error('Feil ved opprettelse av handlingsmal: ' + error.message);
    }
  });
}

export function useUpdateAuditActionTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<AuditActionTemplate>) => {
      // Map AuditPhase values to database enum values if applicable_phases is being updated
      let mappedPhases: Database['public']['Enums']['audit_phase'][] | undefined = undefined;
      if (updates.applicable_phases) {
        mappedPhases = updates.applicable_phases.map(phase => 
          toDbPhase(phase as AuditPhase)
        ) as Database['public']['Enums']['audit_phase'][];
      }

      const updateData = {
        ...updates,
        subject_area: updates.subject_area as any, // Type assertion for dynamic subject areas
        applicable_phases: mappedPhases
      };

      const { data, error } = await supabase
        .from('audit_action_templates')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating audit action template:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-action-templates'] });
      toast.success('Handlingsmal oppdatert');
    },
    onError: (error: any) => {
      logger.error('Failed to update audit action template:', error);
      toast.error('Feil ved oppdatering av handlingsmal: ' + error.message);
    }
  });
}

export function useDeleteAuditActionTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audit_action_templates')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting audit action template:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-action-templates'] });
      toast.success('Handlingsmal slettet');
    },
    onError: (error: any) => {
      logger.error('Failed to delete audit action template:', error);
      toast.error('Feil ved sletting av handlingsmal: ' + error.message);
    }
  });
}
