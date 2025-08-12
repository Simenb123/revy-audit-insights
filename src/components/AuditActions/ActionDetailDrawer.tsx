import React, { useEffect, useMemo, useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateClientAuditAction } from '@/hooks/useAuditActions';
import { useWorkingPaperTemplates } from '@/hooks/useEnhancedAuditActions';
import type { ClientAuditAction } from '@/types/audit-actions';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ActionDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ClientAuditAction | null;
}

const ActionDetailDrawer: React.FC<ActionDetailDrawerProps> = ({ open, onOpenChange, action }) => {
  const updateMutation = useUpdateClientAuditAction();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [procedures, setProcedures] = useState('');
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [workNotes, setWorkNotes] = useState('');
  const [wpJson, setWpJson] = useState<string>('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  const { data: templates = [] } = useWorkingPaperTemplates(
    action?.subject_area as any,
    action?.action_type as any
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (action) {
      setName(action.name || '');
      setDescription(action.description || '');
      setProcedures(action.procedures || '');
      setDueDate(action.due_date ? action.due_date.substring(0, 10) : undefined);
      setWorkNotes(action.work_notes || '');
      try {
        const initial = (action as any).working_paper_data ?? {};
        setWpJson(JSON.stringify(initial, null, 2));
        setJsonError(null);
      } catch {
        setWpJson('{}');
        setJsonError(null);
      }
      setSelectedTemplateId((action as any).working_paper_template_id || undefined);
    }
  }, [action]);

  const autoMetrics = useMemo(() => {
    try {
      return (action as any)?.auto_metrics ?? {};
    } catch {
      return {};
    }
  }, [action]);

  const handleSave = async () => {
    if (!action) return;
    let parsed: any = {};
    try {
      parsed = wpJson.trim() ? JSON.parse(wpJson) : {};
      setJsonError(null);
    } catch (e: any) {
      setJsonError('Ugyldig JSON i arbeidsnotat-data.');
      return;
    }

    await updateMutation.mutateAsync({
      id: action.id,
      updates: {
        name,
        description,
        procedures,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        work_notes: workNotes,
        // new columns
        working_paper_data: parsed,
        working_paper_template_id: selectedTemplateId ?? null,
      } as any,
    });

    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <div className="flex flex-col h-full">
          <div className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Rediger handling</h2>
                <p className="text-sm text-muted-foreground">Oppdater detaljer og arbeidsnotat</p>
              </div>
              {action && (
                <div className="text-xs text-muted-foreground">
                  Fase: {action.phase} · Status: {action.status}
                </div>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tittel</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Beskrivelse</Label>
                    <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proc">Prosedyrer</Label>
                    <Textarea id="proc" value={procedures} onChange={(e) => setProcedures(e.target.value)} rows={8} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due">Forfallsdato</Label>
                    <Input id="due" type="date" value={dueDate || ''} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Arbeidsnotater</Label>
                    <Textarea id="notes" value={workNotes} onChange={(e) => setWorkNotes(e.target.value)} rows={4} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Arbeidspapir-mal</Label>
                    <Select
                      value={selectedTemplateId}
                      onValueChange={(val) => {
                        setSelectedTemplateId(val);
                        const tpl = templates.find((t: any) => t.id === val);
                        if (tpl && tpl.template_structure) {
                          try {
                            setWpJson(JSON.stringify(tpl.template_structure, null, 2));
                            setJsonError(null);
                          } catch {
                            // ignore
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg mal (filtrert på fagområde og type)" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="wp">Arbeidsnotat-data (JSON)</Label>
                      <div className="flex items-center gap-2">
                        {jsonError ? (
                          <span className="flex items-center gap-1 text-destructive text-xs"><AlertTriangle className="h-3 w-3" /> {jsonError}</span>
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground text-xs"><CheckCircle2 className="h-3 w-3" /> Gyldig</span>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setShowJson((v) => !v)}>
                          {showJson ? 'Skjul JSON' : 'Vis JSON'}
                        </Button>
                      </div>
                    </div>
                    {showJson && (
                      <Textarea id="wp" value={wpJson} onChange={(e) => setWpJson(e.target.value)} rows={16} className="font-mono text-xs" />
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Auto-metrics (lesevisning)</Label>
                    <pre className="bg-muted rounded-md p-3 text-xs overflow-auto max-h-48">
                      {JSON.stringify(autoMetrics, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Lagrer...' : 'Lagre endringer'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ActionDetailDrawer;
