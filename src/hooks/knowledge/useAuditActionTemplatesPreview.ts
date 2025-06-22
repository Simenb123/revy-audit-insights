
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAuditActionTemplatesPreview = (subjectArea?: string, limit = 5) => {
  return useQuery({
    queryKey: ['audit-action-templates-preview', subjectArea, limit],
    queryFn: async () => {
      let query = supabase
        .from('audit_action_templates')
        .select(`
          id,
          name,
          description,
          subject_area,
          action_type,
          risk_level,
          estimated_hours,
          is_system_template
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (subjectArea) {
        query = query.eq('subject_area', subjectArea);
      }

      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;
      return data;
    }
  });
};

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
