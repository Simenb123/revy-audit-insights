import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { devLog } from '@/utils/devLogger';
import type { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';

export interface ReportTemplate {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  widgets: Omit<Widget, 'id'>[];
  layouts: Omit<WidgetLayout, 'i' | 'widgetId'>[];
}

export function useReportTemplates() {
  return useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_templates')
        .select('id, title, description, icon, widgets, layouts');

      if (error) {
        devLog('Error fetching report templates:', error);
        throw error;
      }

      return (data || []) as ReportTemplate[];
    },
  });
}
