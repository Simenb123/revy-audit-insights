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
      // Use edge function since the table isn't in types yet
      const { data, error } = await supabase.functions.invoke('get-widget-templates');

      if (error) {
        logger.error('Error fetching widget templates:', error);
        return [];
      }

      return (data || []).map((t: any) => ({
        type: t.type,
        description: t.description,
        defaultConfig: t.default_config,
      }));
    },
  });
}
