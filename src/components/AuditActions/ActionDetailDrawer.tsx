import React, { useEffect, useMemo, useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUpdateClientAuditAction } from '@/hooks/useAuditActions';
import { useWorkingPaperTemplates } from '@/hooks/useEnhancedAuditActions';
import type { ClientAuditAction } from '@/types/audit-actions';
import TemplateSelector from './TemplateSelector';
import JsonEditor from './JsonEditor';
import AutoMetricsViewer from './AutoMetricsViewer';
import ActionDetailsForm from './ActionDetailsForm';

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
                <ActionDetailsForm
                  name={name}
                  description={description}
                  procedures={procedures}
                  dueDate={dueDate}
                  workNotes={workNotes}
                  onNameChange={setName}
                  onDescriptionChange={setDescription}
                  onProceduresChange={setProcedures}
                  onDueDateChange={(v) => setDueDate(v)}
                  onWorkNotesChange={setWorkNotes}
                />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <TemplateSelector
                      templates={templates as any}
                      value={selectedTemplateId}
                      onChange={(val) => setSelectedTemplateId(val)}
                      onTemplateSelected={(tpl) => {
                        if (tpl && tpl.template_structure) {
                          try {
                            setWpJson(JSON.stringify(tpl.template_structure, null, 2));
                            setJsonError(null);
                          } catch {
                            // ignore
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <JsonEditor
                      value={wpJson}
                      error={jsonError}
                      show={showJson}
                      onToggleShow={() => setShowJson((v) => !v)}
                      onChange={(val) => setWpJson(val)}
                    />
                  </div>

                  <Separator />

                  <AutoMetricsViewer metrics={autoMetrics} />
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
