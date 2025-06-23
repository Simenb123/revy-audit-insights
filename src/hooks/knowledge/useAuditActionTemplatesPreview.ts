
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAuditActionTemplateCount = () => {
  return useQuery({
    queryKey: ['audit-action-template-count'],
    queryFn: async () => {
      console.log('🔧 [ACTION_TEMPLATES] Counting audit action templates...');
      
      const { count, error } = await supabase
        .from('audit_action_templates')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) {
        console.error('🔧 [ACTION_TEMPLATES] Count error:', error);
        throw error;
      }

      console.log('🔧 [ACTION_TEMPLATES] Total templates count:', count);
      return count || 0;
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAuditActionTemplatesBySubjectArea = () => {
  return useQuery({
    queryKey: ['audit-action-templates-by-subject-area'],
    queryFn: async () => {
      console.log('🔧 [ACTION_TEMPLATES] Fetching templates by subject area...');
      
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

      if (error) {
        console.error('🔧 [ACTION_TEMPLATES] Fetch error:', error);
        throw error;
      }

      console.log('🔧 [ACTION_TEMPLATES] Fetched templates:', data?.length || 0);
      console.log('🔧 [ACTION_TEMPLATES] Templates data:', data);
      return data || [];
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
