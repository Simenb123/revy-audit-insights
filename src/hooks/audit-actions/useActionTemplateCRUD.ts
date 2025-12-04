import { logger } from '@/utils/logger';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import type { AuditActionTemplate, AuditSubjectArea } from '@/types/audit-actions';
import { toDbPhase, fromDbPhase } from '@/constants/auditPhases';
import type { AuditPhase } from '@/types/revio';

type DbAuditActionTemplate = Database['public']['Tables']['audit_action_templates']['Row'];
type DbAuditPhase = Database['public']['Enums']['audit_phase'];

interface MutationError {
  message: string;
}

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
          query = query.eq('subject_area', subjectArea);
        }
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }
      const normalized = (data || []).map((t: DbAuditActionTemplate) => ({
        ...t,
        applicable_phases: (t.applicable_phases || []).map((p: DbAuditPhase) => fromDbPhase(p))
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

      // Validate subject_area_id if provided (new preferred method)
      if (templateData.subject_area_id) {
        const { data: subjectArea, error: subjectAreaError } = await supabase
          .from('subject_areas')
          .select('name')
          .eq('id', templateData.subject_area_id)
          .single();
        
        if (subjectAreaError || !subjectArea) {
          throw new Error('Ugyldig fagområde valgt');
        }
      }

      const dataToInsert = {
        ...templateData,
        applicable_phases: mappedPhases as Database['public']['Enums']['audit_phase'][]
      };

      const { data, error } = await supabase
        .from('audit_action_templates')
        .insert(dataToInsert)
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
      queryClient.invalidateQueries({ queryKey: ['audit-action-template-count'] });
      queryClient.invalidateQueries({ queryKey: ['audit-action-templates-by-subject-area'] });
      toast.success('Handlingsmal opprettet');
    },
    onError: (error: MutationError) => {
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

      // Validate subject_area_id if being updated
      if (updates.subject_area_id) {
        const { data: subjectArea, error: subjectAreaError } = await supabase
          .from('subject_areas')
          .select('name')
          .eq('id', updates.subject_area_id)
          .single();
        
        if (subjectAreaError || !subjectArea) {
          throw new Error('Ugyldig fagområde valgt');
        }
      }

      const updateData = {
        ...updates,
        applicable_phases: mappedPhases
      };

      const { data, error } = await supabase
        .from('audit_action_templates')
        .update(updateData)
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
      queryClient.invalidateQueries({ queryKey: ['audit-action-template-count'] });
      queryClient.invalidateQueries({ queryKey: ['audit-action-templates-by-subject-area'] });
      toast.success('Handlingsmal oppdatert');
    },
    onError: (error: MutationError) => {
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
    onError: (error: MutationError) => {
      logger.error('Failed to delete audit action template:', error);
      toast.error('Feil ved sletting av handlingsmal: ' + error.message);
    }
  });
}
