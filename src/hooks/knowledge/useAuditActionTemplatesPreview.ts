
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAuditActionTemplateCount = () => {
  return useQuery({
    queryKey: ['audit-action-template-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('audit_action_templates')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    }
  });
};

export const useAuditActionTemplatesBySubjectArea = () => {
  return useQuery({
    queryKey: ['audit-action-templates-by-subject-area'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_action_templates')
        .select(`
          id,
          name,
          description,
          subject_area,
          action_type,
          risk_level,
          estimated_hours,
          is_system_template,
          is_active,
          subject_area_id,
          subject_areas!inner(
            id,
            name,
            display_name
          )
        `)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    }
  });
};
