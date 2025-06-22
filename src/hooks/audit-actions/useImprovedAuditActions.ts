
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AuditSubjectArea, ActionType, AuditPhase, RiskLevel } from '@/types/audit-actions';

export interface ImprovedAuditActionTemplate {
  id: string;
  name: string;
  description: string;
  subject_area: AuditSubjectArea;
  action_type: ActionType;
  objective?: string;
  procedures: string;
  documentation_requirements?: string;
  estimated_hours?: number;
  risk_level: RiskLevel;
  applicable_phases: AuditPhase[];
  sort_order: number;
  is_system_template: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useImprovedAuditActionTemplates = (subjectArea?: AuditSubjectArea) => {
  return useQuery({
    queryKey: ['improved-audit-action-templates', subjectArea],
    queryFn: async () => {
      console.log('🔍 Fetching audit action templates with subject area:', subjectArea);
      
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
        console.error('❌ Error fetching audit action templates:', error);
        throw error;
      }
      
      console.log('✅ Fetched audit action templates:', data?.length || 0);
      return data as ImprovedAuditActionTemplate[];
    }
  });
};

export const useCreateImprovedAuditActionTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Omit<ImprovedAuditActionTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('🔄 Creating audit action template:', template);
      
      // Validate required fields
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
      
      // Ensure applicable_phases is not empty
      if (!template.applicable_phases || template.applicable_phases.length === 0) {
        template.applicable_phases = ['execution'];
      }
      
      const { data, error } = await supabase
        .from('audit_action_templates')
        .insert(template)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating audit action template:', error);
        throw error;
      }
      
      console.log('✅ Created audit action template:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improved-audit-action-templates'] });
      queryClient.invalidateQueries({ queryKey: ['audit-action-template-count'] });
      toast.success('Revisjonshandling opprettet');
    },
    onError: (error: any) => {
      console.error('❌ Mutation error:', error);
      toast.error('Feil ved opprettelse: ' + (error.message || 'Ukjent feil'));
    }
  });
};

export const useUpdateImprovedAuditActionTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ImprovedAuditActionTemplate> & { id: string }) => {
      console.log('🔄 Updating audit action template:', id, updates);
      
      const { data, error } = await supabase
        .from('audit_action_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating audit action template:', error);
        throw error;
      }
      
      console.log('✅ Updated audit action template:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improved-audit-action-templates'] });
      toast.success('Revisjonshandling oppdatert');
    },
    onError: (error: any) => {
      console.error('❌ Update mutation error:', error);
      toast.error('Feil ved oppdatering: ' + (error.message || 'Ukjent feil'));
    }
  });
};

export const useDeleteImprovedAuditActionTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🔄 Deleting audit action template:', id);
      
      const { error } = await supabase
        .from('audit_action_templates')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleting audit action template:', error);
        throw error;
      }
      
      console.log('✅ Deleted audit action template:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improved-audit-action-templates'] });
      queryClient.invalidateQueries({ queryKey: ['audit-action-template-count'] });
      toast.success('Revisjonshandling slettet');
    },
    onError: (error: any) => {
      console.error('❌ Delete mutation error:', error);
      toast.error('Feil ved sletting: ' + (error.message || 'Ukjent feil'));
    }
  });
};
