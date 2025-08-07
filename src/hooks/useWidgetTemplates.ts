import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

export interface WidgetTemplate {
  type: string;
  description: string;
  defaultConfig: any;
}

export function useWidgetTemplates() {
  return useQuery({
    queryKey: ['widget-templates'],
    queryFn: async (): Promise<WidgetTemplate[]> => {
      const { data, error } = await (supabase as any)
        .from('widget_templates')
        .select('type, description, default_config');

      if (error) {
        logger.error('Error fetching widget templates:', error);
        return [];
      }

      return (data || []).map(t => ({
        type: t.type,
        description: t.description,
        defaultConfig: t.default_config,
      }));
    },
  });
}
