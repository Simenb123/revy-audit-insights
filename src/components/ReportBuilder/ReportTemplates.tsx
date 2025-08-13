import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { X, Save, Trash2 } from 'lucide-react'
import { useReportTemplates, type ReportTemplate } from '@/hooks/useReportTemplates'
import type { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext'
import { toast } from 'sonner'

interface ReportTemplatesProps {
  clientId: string
  widgets: Widget[]
  layouts: WidgetLayout[]
  onApplyTemplate: (widgets: Widget[], layouts: WidgetLayout[]) => void
  onClose: () => void
}

export function ReportTemplates({ clientId, widgets, layouts, onApplyTemplate, onClose }: ReportTemplatesProps) {
  const { listTemplates, createTemplate, deleteTemplate } = useReportTemplates()
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [name, setName] = useState('')

  useEffect(() => {
    listTemplates().then(setTemplates).catch(() => setTemplates([]))
  }, [listTemplates])

  const handleSave = async () => {
    if (!name.trim()) return
    try {
      await createTemplate(name, widgets, layouts)
      toast.success('Mal lagret')
      setName('')
      setTemplates(await listTemplates())
    } catch {
      toast.error('Kunne ikke lagre mal')
    }
  }

  const handleApply = (template: ReportTemplate) => {
    const templWidgets: Widget[] = template.config.widgets.map((w, index) => ({
      ...w,
      id: `widget-${Date.now()}-${index}`,
      config: { ...w.config, clientId },
    }))
    const templLayouts: WidgetLayout[] = template.config.layouts.map((l, index) => ({
      ...l,
      i: templWidgets[index].id,
      widgetId: templWidgets[index].id,
    }))
    onApplyTemplate(templWidgets, templLayouts)
    onClose()
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id)
      setTemplates(await listTemplates())
      toast.success('Mal slettet')
    } catch {
      toast.error('Kunne ikke slette mal')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mine rapport maler</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Navn på mal"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Lagre
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => (
          <Card key={t.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row justify-between items-center">
              <CardTitle className="text-sm">{t.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs mb-2">
                {new Date(t.created_at).toLocaleString()}
              </CardDescription>
              <Button size="sm" onClick={() => handleApply(t)}>
                Bruk mal
              </Button>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <div className="text-sm text-muted-foreground">Ingen maler lagret</div>
        )}
      </div>
    </div>
  )
}
