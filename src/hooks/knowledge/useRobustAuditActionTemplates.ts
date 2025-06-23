
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRobustAuditActionTemplateCount = () => {
  return useQuery({
    queryKey: ['robust-audit-action-template-count'],
    queryFn: async () => {
      console.log('🔧 [ROBUST_ACTION_TEMPLATES] Counting audit action templates...');
      
      try {
        const { count, error } = await supabase
          .from('audit_action_templates')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        if (error) {
          console.error('🔧 [ROBUST_ACTION_TEMPLATES] Count error:', error);
          return 0; // Return 0 instead of throwing
        }

        console.log('🔧 [ROBUST_ACTION_TEMPLATES] Total templates count:', count);
        return count || 0;
      } catch (error) {
        console.error('🔧 [ROBUST_ACTION_TEMPLATES] Fatal error:', error);
        return 0;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5,
    select: (data) => data ?? 0,
  });
};

export const useRobustAuditActionTemplatesBySubjectArea = () => {
  return useQuery({
    queryKey: ['robust-audit-action-templates-by-subject-area'],
    queryFn: async () => {
      console.log('🔧 [ROBUST_ACTION_TEMPLATES] Fetching templates by subject area...');
      
      try {
        const { data, error } = await supabase
          .from('audit_action_templates')
          .select(`
            id,
            name,
            description,
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
          console.error('🔧 [ROBUST_ACTION_TEMPLATES] Fetch error:', error);
          return []; // Return empty array instead of throwing
        }

        console.log('🔧 [ROBUST_ACTION_TEMPLATES] Fetched templates:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('🔧 [ROBUST_ACTION_TEMPLATES] Fatal error:', error);
        return [];
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5,
    select: (data) => data || [],
  });
};
