
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSubjectAreasWithCounts = () => {
  return useQuery({
    queryKey: ['subject-areas-with-counts'],
    queryFn: async () => {
      // Get all subject areas
      const { data: subjectAreas, error: subjectAreasError } = await supabase
        .from('subject_areas')
        .select('*')
        .eq('is_active', true)
        .order('sort_order, display_name');

      if (subjectAreasError) throw subjectAreasError;

      // Get counts for each subject area
      const areasWithCounts = await Promise.all(
        subjectAreas.map(async (area) => {
          // Count audit action templates
          const { count: actionCount, error: actionError } = await supabase
            .from('audit_action_templates')
            .select('*', { count: 'exact', head: true })
            .eq('subject_area', area.name)
            .eq('is_active', true);

          if (actionError) throw actionError;

          // Count articles related to this subject area
          const { count: articleCount, error: articleError } = await supabase
            .from('article_subject_areas')
            .select('*', { count: 'exact', head: true })
            .eq('subject_area_id', area.id);

          if (articleError) throw articleError;

          return {
            ...area,
            action_count: actionCount || 0,
            article_count: articleCount || 0
          };
        })
      );

      return areasWithCounts;
    }
  });
};
