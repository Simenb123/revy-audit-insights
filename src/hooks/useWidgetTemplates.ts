import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

export interface WidgetTemplate {
  type: string;
  description: string;
  defaultConfig: any;
}

export function useWidgetTemplates(enabled: boolean = true) {
  return useQuery({
    queryKey: ['widget-templates'],
    enabled,
    queryFn: async (): Promise<WidgetTemplate[]> => {
      try {
        logger.info('Fetching widget templates...');
        
        // Use edge function since the table isn't in types yet
        const { data, error } = await supabase.functions.invoke('get-widget-templates');

        if (error) {
          logger.warn('Widget templates unavailable:', error);
          return [];
        }

        const templates = (data || []).map((t: any) => ({
          type: t.widget_type,
          description: t.description,
          defaultConfig: t.default_config,
        }));

        logger.info(`[templates] loaded: ${templates.length} templates`);
        return templates;
      } catch (error) {
        logger.warn('Failed to fetch widget templates, using defaults:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once to avoid spam
  });
}
