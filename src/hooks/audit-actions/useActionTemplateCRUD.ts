import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AuditActionTemplate, AuditSubjectArea } from '@/types/audit-actions';

export const useAuditActionTemplates = (subjectArea?: AuditSubjectArea) => {
  return useQuery({
    queryKey: ['audit-action-templates', subjectArea],
    queryFn: async () => {
      let query = supabase
        .from('audit_action_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order, name');

      if (subjectArea) {
        query = query.eq('subject_area', subjectArea);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as AuditActionTemplate[];
    }
  });
};

export const useCreateAuditActionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Omit<AuditActionTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      if (!template.name?.trim()) {
        throw new Error('Navn er påkrevd');
      }

      if (!template.procedures?.trim()) {
        throw new Error('Prosedyrer er påkrevd');
      }

      if (!template.subject_area) {
        throw new Error('Emneområde er påkrevd');
      }

      if (!template.action_type) {
        throw new Error('Handlingstype er påkrevd');
      }

      if (!template.applicable_phases || template.applicable_phases.length === 0) {
        template.applicable_phases = ['execution'];
      }

      const { data, error } = await supabase
        .from('audit_action_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-action-templates'] });
      queryClient.invalidateQueries({ queryKey: ['audit-action-template-count'] });
      toast.success('Revisjonshandling opprettet');
    },
    onError: (error: any) => {
      toast.error('Feil ved opprettelse: ' + (error.message || 'Ukjent feil'));
    }
  });
};

export const useUpdateAuditActionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AuditActionTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('audit_action_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-action-templates'] });
      toast.success('Revisjonshandling oppdatert');
    },
    onError: (error: any) => {
      toast.error('Feil ved oppdatering: ' + (error.message || 'Ukjent feil'));
    }
  });
};

export const useDeleteAuditActionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audit_action_templates')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-action-templates'] });
      queryClient.invalidateQueries({ queryKey: ['audit-action-template-count'] });
      toast.success('Revisjonshandling slettet');
    },
    onError: (error: any) => {
      toast.error('Feil ved sletting: ' + (error.message || 'Ukjent feil'));
    }
  });
};
