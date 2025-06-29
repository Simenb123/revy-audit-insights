import { logger } from '@/utils/logger';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditActionTemplateOptions {
  /**
   * When true, errors are swallowed and a default value is returned.
   * When false, errors are thrown so callers can handle them.
   */
  robust?: boolean;
}

export const useAuditActionTemplateCount = (
  options: AuditActionTemplateOptions = {}
) => {
  const { robust = false } = options;
  return useQuery({
    queryKey: ['audit-action-template-count', robust],
    queryFn: async () => {
      logger.log('[ACTION_TEMPLATES] Counting audit action templates...');
      try {
        const { count, error } = await supabase
          .from('audit_action_templates')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        if (error) {
          logger.error('[ACTION_TEMPLATES] Count error:', error);
          if (robust) {
            return 0;
          }
          throw error;
        }

        logger.log('[ACTION_TEMPLATES] Total templates count:', count);
        return count || 0;
      } catch (err) {
        logger.error('[ACTION_TEMPLATES] Fatal error:', err);
        if (robust) {
          return 0;
        }
        throw err;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5,
    ...(robust && { select: (data: number | undefined) => data ?? 0 }),
  });
};

export const useAuditActionTemplatesBySubjectArea = (
  options: AuditActionTemplateOptions = {}
) => {
  const { robust = false } = options;
  return useQuery({
    queryKey: ['audit-action-templates-by-subject-area', robust],
    queryFn: async () => {
      logger.log('[ACTION_TEMPLATES] Fetching templates by subject area...');
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
          logger.error('[ACTION_TEMPLATES] Fetch error:', error);
          if (robust) {
            return [] as any[];
          }
          throw error;
        }

        logger.log('[ACTION_TEMPLATES] Fetched templates:', data?.length || 0);
        return data || [];
      } catch (err) {
        logger.error('[ACTION_TEMPLATES] Fatal error:', err);
        if (robust) {
          return [] as any[];
        }
        throw err;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5,
    ...(robust && { select: (data: any[] | undefined) => data || [] }),
  });
};
