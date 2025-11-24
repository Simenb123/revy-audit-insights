import React, { useEffect, useMemo, useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUpdateClientAuditAction } from '@/hooks/useAuditActions';
import { useWorkingPaperTemplates, useActionISAMappings, useActionDocumentMappings, useActionAIMetadata, useEnhancedAuditActionTemplates } from '@/hooks/useEnhancedAuditActions';
import type { ClientAuditAction } from '@/types/audit-actions';
import TemplateSelector from './TemplateSelector';
import JsonEditor from './JsonEditor';
import AutoMetricsViewer from './AutoMetricsViewer';
import ActionDetailsForm from './ActionDetailsForm';
import ActionDrawerHeader from './ActionDrawerHeader';
import ActionDrawerFooter from './ActionDrawerFooter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPhaseLabel, PHASE_CONFIG } from '@/constants/auditPhases';
import type { AuditPhase } from '@/types/revio';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Brain } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import EnhancedTemplateView from './EnhancedTemplateView';
import { toast } from 'sonner';
import ActionComments from './Comments/ActionComments';

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

  const templateId = (action?.template_id as string | undefined) || undefined;
  const { data: isaMappings = [] } = useActionISAMappings(templateId);
  const { data: documentMappings = [] } = useActionDocumentMappings(templateId);
  const { data: aiMetadata } = useActionAIMetadata(templateId);
  const [showTemplate, setShowTemplate] = useState(false);
  const { data: enhancedTemplates = [] } = useEnhancedAuditActionTemplates();
  const linkedTemplate = useMemo(() => enhancedTemplates.find((t: any) => t.id === templateId), [enhancedTemplates, templateId]);

  const { data: templates = [] } = useWorkingPaperTemplates(
    action?.subject_area as any,
    action?.action_type as any
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [phase, setPhase] = useState<AuditPhase | ''>('');

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
      setPhase((action?.phase as AuditPhase) || '');
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
        ...(phase ? { phase } : {}),
      } as any,
    });

    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <div className="flex flex-col h-full">
          <ActionDrawerHeader
            action={action}
            title="Rediger handling"
            subtitle="Oppdater detaljer og arbeidsnotat"
          />

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Comments Section */}
              {action && (
                <ActionComments actionId={action.id} />
              )}

              <Separator />

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
                  <label className="text-sm font-medium">Fase</label>
                  <Select value={phase || ''} onValueChange={(v) => setPhase(v as AuditPhase)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PHASE_CONFIG).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                  {templateId && (
                    <>
                      <div className="space-y-2">
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Knyttet mal</div>
                          <Button variant="link" size="sm" onClick={() => setShowTemplate(true)}>Åpne mal</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {(isaMappings?.length || 0) > 0 && (
                            <span className="flex items-center gap-1"><BookOpen size={12} /> {isaMappings.length} ISA</span>
                          )}
                          {(documentMappings?.length || 0) > 0 && (
                            <span className="flex items-center gap-1"><FileText size={12} /> {documentMappings.length} dokumentkrav</span>
                          )}
                          {aiMetadata && (
                            <span className="flex items-center gap-1"><Brain size={12} /> AI‑assistert</span>
                          )}
                        </div>

                        {(isaMappings?.length || 0) > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {isaMappings.slice(0, 3).map((m) => (
                              <Badge key={m.id} variant="outline" className="text-xs">
                                {m.isa_standard?.isa_number || 'ISA'} {m.isa_standard?.title || ''}
                              </Badge>
                            ))}
                            {isaMappings.length > 3 && (
                              <Badge variant="secondary" className="text-xs">+{isaMappings.length - 3} flere</Badge>
                            )}
                          </div>
                        )}

                        {(documentMappings?.length || 0) > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {documentMappings.slice(0, 3).map((m) => (
                              <Badge key={m.id} variant="outline" className="text-xs">
                                {m.document_requirement?.name || 'Dokument'}
                              </Badge>
                            ))}
                            {documentMappings.length > 3 && (
                              <Badge variant="secondary" className="text-xs">+{documentMappings.length - 3} flere</Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <Dialog open={showTemplate} onOpenChange={setShowTemplate}>
                        <DialogContent className="max-w-4xl">
                          <div className="flex items-center justify-between">
                            <DialogTitle>Mal</DialogTitle>
                            <Button
                              size="sm"
                              onClick={() => {
                                const tpl = (linkedTemplate as any)?.working_paper_template;
                                if (tpl?.id) {
                                  setSelectedTemplateId(tpl.id);
                                  if (tpl.template_structure) {
                                    try {
                                      setWpJson(JSON.stringify(tpl.template_structure, null, 2));
                                      setJsonError(null);
                                    } catch {}
                                  }
                                  setShowTemplate(false);
                                  toast.success('Mal anvendt på handlingen');
                                }
                              }}
                              disabled={!linkedTemplate || !(linkedTemplate as any)?.working_paper_template}
                            >
                              Bruk på handling
                            </Button>
                          </div>
                          {linkedTemplate ? (
                            <EnhancedTemplateView template={linkedTemplate as any} />
                          ) : (
                            <div className="text-sm text-muted-foreground">Laster mal...</div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                </div>
              </div>
            </div>
          </ScrollArea>

          <ActionDrawerFooter
            onCancel={() => onOpenChange(false)}
            onSave={handleSave}
            isSaving={updateMutation.isPending}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ActionDetailDrawer;
