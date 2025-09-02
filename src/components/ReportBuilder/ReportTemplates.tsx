import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X, Save, Trash2 } from 'lucide-react'
import { WidgetPreview } from './WidgetPreview'
import { useReportTemplates, type ReportTemplate } from '@/hooks/useReportTemplates'
import type { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext'
import { toast } from 'sonner'

interface ReportTemplatesProps {
  clientId: string
  widgets: Widget[]
  layouts: WidgetLayout[]
  onApplyTemplate: (widgets: Widget[], layouts: WidgetLayout[]) => void
  onClose: () => void
  isVisible?: boolean
}

export function ReportTemplates({ clientId, widgets, layouts, onApplyTemplate, onClose, isVisible = true }: ReportTemplatesProps) {
  const { listTemplates, createTemplate, updateTemplate, deleteTemplate } = useReportTemplates()
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [name, setName] = useState('')
  const [preview, setPreview] = useState<ReportTemplate | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

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

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return
    try {
      await updateTemplate(id, editingName, widgets, layouts)
      toast.success('Mal oppdatert')
      setTemplates(await listTemplates())
      setEditingId(null)
      setEditingName('')
    } catch {
      toast.error('Kunne ikke oppdatere mal')
    }
  }

  if (!isVisible) {
    return (
      <div className="space-y-4 opacity-0 pointer-events-none">
        <p className="text-muted-foreground">Rapport maler vil vises når data er tilgjengelig</p>
      </div>
    );
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
              {editingId === t.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleUpdate(t.id)}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <CardTitle className="text-sm">{t.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(t.id)
                        setEditingName(t.name)
                      }}
                    >
                      Endre
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs mb-2">
                {new Date(t.created_at).toLocaleString()}
              </CardDescription>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreview(t)}>
                  Forhåndsvis
                </Button>
                <Button size="sm" onClick={() => handleApply(t)}>
                  Bruk mal
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <div className="text-sm text-muted-foreground">Ingen maler lagret</div>
        )}
      </div>

      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null) }}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Forhåndsvis mal</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {preview.name} • {new Date(preview.created_at).toLocaleString()}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {preview.config.widgets.slice(0, 4).map((w, idx) => (
                  <WidgetPreview key={idx} type={(w as any).type} title={(w as any).title} config={(w as any).config} />
                ))}
              </div>
              <div className="text-xs text-muted-foreground">Forhåndsvisning viser eksempeldata, ikke live.</div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setPreview(null)}>Lukk</Button>
                <Button onClick={() => { handleApply(preview); setPreview(null); }}>Bruk denne</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
