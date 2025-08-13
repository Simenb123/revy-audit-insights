import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext'

export interface ReportTemplate {
  id: string
  user_id: string
  name: string
  config: {
    widgets: Omit<Widget, 'id'>[]
    layouts: Omit<WidgetLayout, 'i' | 'widgetId'>[]
  }
  created_at: string
}

export function useReportTemplates() {
  const listTemplates = useCallback(async (): Promise<ReportTemplate[]> => {
    const { data, error } = await supabase.functions.invoke('report-templates')
    if (error) throw error
    return data as ReportTemplate[]
  }, [])

  const createTemplate = useCallback(
    async (name: string, widgets: Widget[], layouts: WidgetLayout[]) => {
      const config = {
        widgets: widgets.map(({ id, ...rest }) => rest),
        layouts: layouts.map(({ i, widgetId, ...rest }) => rest),
      }
      const { error } = await supabase.functions.invoke('report-templates', {
        method: 'POST',
        body: { name, config },
      })
      if (error) throw error
    },
    [],
  )

  const updateTemplate = useCallback(
    async (id: string, name: string, widgets: Widget[], layouts: WidgetLayout[]) => {
      const config = {
        widgets: widgets.map(({ id: _id, ...rest }) => rest),
        layouts: layouts.map(({ i, widgetId, ...rest }) => rest),
      }
      const { error } = await supabase.functions.invoke('report-templates', {
        method: 'PUT',
        body: { id, name, config },
      })
      if (error) throw error
    },
    [],
  )

  const deleteTemplate = useCallback(async (id: string) => {
    const { error } = await supabase.functions.invoke('report-templates', {
      method: 'DELETE',
      body: { id },
    })
    if (error) throw error
  }, [])

  return { listTemplates, createTemplate, updateTemplate, deleteTemplate }
}
