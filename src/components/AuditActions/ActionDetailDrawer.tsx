import React, { useEffect, useMemo, useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUpdateClientAuditAction } from '@/hooks/useAuditActions';
import { useWorkingPaperTemplates, useActionISAMappings, useActionDocumentMappings, useActionAIMetadata, useEnhancedAuditActionTemplates } from '@/hooks/useEnhancedAuditActions';
import { useAuditActionTemplates } from '@/hooks/audit-actions/useActionTemplateCRUD';
import type { ClientAuditAction, ActionStatus } from '@/types/audit-actions';
import TemplateSelector from './TemplateSelector';
import JsonEditor from './JsonEditor';
import AutoMetricsViewer from './AutoMetricsViewer';
import ActionStatusControl from './ActionStatusControl';
import ResponseFieldsRenderer from './ResponseFieldsRenderer';
import ActionDrawerFooter from './ActionDrawerFooter';
import { getPhaseLabel, PHASE_CONFIG } from '@/constants/auditPhases';
import type { AuditPhase } from '@/types/revio';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import EnhancedTemplateView from './EnhancedTemplateView';
import { toast } from 'sonner';
import ActionComments from './Comments/ActionComments';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActionDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ClientAuditAction | null;
}

const ActionDetailDrawer: React.FC<ActionDetailDrawerProps> = ({ open, onOpenChange, action }) => {
  const updateMutation = useUpdateClientAuditAction();

  const [status, setStatus] = useState<ActionStatus>('not_started');
  const [findings, setFindings] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [responseFieldValues, setResponseFieldValues] = useState<Record<string, any>>({});
  const [responseFieldErrors, setResponseFieldErrors] = useState<Record<string, string>>({});
  const [wpJson, setWpJson] = useState<string>('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const templateId = (action?.template_id as string | undefined) || undefined;
  const { data: isaMappings = [] } = useActionISAMappings(templateId);
  const { data: documentMappings = [] } = useActionDocumentMappings(templateId);
  const { data: aiMetadata } = useActionAIMetadata(templateId);
  const [showTemplate, setShowTemplate] = useState(false);
  const { data: enhancedTemplates = [] } = useEnhancedAuditActionTemplates();
  const { data: actionTemplates = [] } = useAuditActionTemplates();
  const linkedTemplate = useMemo(() => enhancedTemplates.find((t: any) => t.id === templateId), [enhancedTemplates, templateId]);
  const actionTemplate = useMemo(() => actionTemplates.find((t: any) => t.id === templateId), [actionTemplates, templateId]);

  const { data: templates = [] } = useWorkingPaperTemplates(
    action?.subject_area as any,
    action?.action_type as any
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [phase, setPhase] = useState<AuditPhase | ''>('');

  useEffect(() => {
    if (action) {
      setStatus(action.status);
      setFindings(action.findings || '');
      setConclusion(action.conclusion || '');
      
      // Load response field values from working_paper_data
      try {
        const wpData = (action as any).working_paper_data ?? {};
        const responseData = wpData.response_data || {};
        setResponseFieldValues(responseData);
        setWpJson(JSON.stringify(wpData, null, 2));
        setJsonError(null);
      } catch {
        setWpJson('{}');
        setResponseFieldValues({});
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

  const validateResponseFields = (): boolean => {
    if (!actionTemplate?.response_fields) return true;
    
    const errors: Record<string, string> = {};
    let hasErrors = false;

    actionTemplate.response_fields.forEach((field: any) => {
      if (field.required) {
        const value = responseFieldValues[field.id];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          errors[field.id] = 'Dette feltet er obligatorisk';
          hasErrors = true;
        }
      }
    });

    setResponseFieldErrors(errors);
    return !hasErrors;
  };

  const calculateCompletionPercentage = (): number => {
    if (!actionTemplate?.response_fields || actionTemplate.response_fields.length === 0) {
      return 0;
    }

    const requiredFields = actionTemplate.response_fields.filter((f: any) => f.required);
    if (requiredFields.length === 0) return 100;

    const completedFields = requiredFields.filter((f: any) => {
      const value = responseFieldValues[f.id];
      return value && (!Array.isArray(value) || value.length > 0);
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const handleSave = async () => {
    if (!action) return;
    
    // Validate required fields before saving
    if (!validateResponseFields()) {
      toast.error('Vennligst fyll ut alle obligatoriske felter');
      return;
    }

    let parsed: any = {};
    try {
      parsed = wpJson.trim() ? JSON.parse(wpJson) : {};
      parsed.response_data = responseFieldValues;
      setJsonError(null);
    } catch (e: any) {
      setJsonError('Ugyldig JSON i arbeidsnotat-data.');
      return;
    }

    await updateMutation.mutateAsync({
      id: action.id,
      updates: {
        status,
        findings,
        conclusion,
        working_paper_data: parsed,
        working_paper_template_id: selectedTemplateId ?? null,
        ...(phase ? { phase } : {}),
      } as any,
    });

    toast.success('Handlingen er oppdatert');
    onOpenChange(false);
  };

  const handleStatusChange = (newStatus: ActionStatus) => {
    if (newStatus === 'completed' && !validateResponseFields()) {
      toast.error('Fyll ut alle obligatoriske felter før du fullfører handlingen');
      return;
    }
    setStatus(newStatus);
  };

  const handleResponseFieldChange = (fieldId: string, value: any) => {
    setResponseFieldValues((prev) => ({
      ...prev,
      [fieldId]: value
    }));
    // Clear error for this field
    if (responseFieldErrors[fieldId]) {
      setResponseFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <div className="flex flex-col h-full">
          {/* Header with title and phase badge */}
          <div className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{action?.name || 'Handling'}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {action?.subject_area} · {action?.action_type}
                </p>
              </div>
              {action && (
                <Badge variant="outline">
                  {getPhaseLabel(action.phase)}
                </Badge>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Status Control */}
              <ActionStatusControl
                currentStatus={status}
                onStatusChange={handleStatusChange}
                completionPercentage={calculateCompletionPercentage()}
              />

              <Separator />

              {/* Instructions (Procedures - Read only) */}
              <Card className="p-4 bg-muted/30">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Prosedyrer</Label>
                  <div className="text-sm whitespace-pre-wrap">{action?.procedures}</div>
                </div>
              </Card>

              {/* Response Fields from Template */}
              {actionTemplate?.response_fields && actionTemplate.response_fields.length > 0 && (
                <ResponseFieldsRenderer
                  fields={actionTemplate.response_fields}
                  values={responseFieldValues}
                  onChange={handleResponseFieldChange}
                  errors={responseFieldErrors}
                />
              )}

              {/* Findings and Conclusion */}
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="findings">Funn / Observasjoner</Label>
                    <Textarea
                      id="findings"
                      value={findings}
                      onChange={(e) => setFindings(e.target.value)}
                      placeholder="Beskriv observasjoner og funn..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conclusion">Konklusjon</Label>
                    <Textarea
                      id="conclusion"
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)}
                      placeholder="Oppsummer konklusjon..."
                      rows={3}
                    />
                  </div>
                </div>
              </Card>

              {/* Documents Section - Placeholder */}
              <Card className="p-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Dokumenter</Label>
                  <p className="text-sm text-muted-foreground">
                    Vedlegg og dokumentasjon vil vises her
                  </p>
                </div>
              </Card>

              {/* Comments */}
              {action && (
                <>
                  <Separator />
                  <ActionComments actionId={action.id} />
                </>
              )}

              {/* Advanced / Technical Details - Collapsed by default */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <Card className="p-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <span className="text-sm font-semibold">Avanserte innstillinger</span>
                      {showAdvanced ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Fase</Label>
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
                        show={true}
                        onToggleShow={() => {}}
                        onChange={(val) => setWpJson(val)}
                      />
                    </div>

                    {Object.keys(autoMetrics).length > 0 && (
                      <>
                        <Separator />
                        <AutoMetricsViewer metrics={autoMetrics} />
                      </>
                    )}

                    {templateId && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">Knyttet mal</div>
                            <Button variant="link" size="sm" onClick={() => setShowTemplate(true)}>
                              Åpne mal
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {(isaMappings?.length || 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <BookOpen size={12} /> {isaMappings.length} ISA
                              </span>
                            )}
                            {(documentMappings?.length || 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <FileText size={12} /> {documentMappings.length} dokumentkrav
                              </span>
                            )}
                            {aiMetadata && (
                              <span className="flex items-center gap-1">
                                <Brain size={12} /> AI‑assistert
                              </span>
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
                                <Badge variant="secondary" className="text-xs">
                                  +{isaMappings.length - 3} flere
                                </Badge>
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
                                <Badge variant="secondary" className="text-xs">
                                  +{documentMappings.length - 3} flere
                                </Badge>
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
                                disabled={
                                  !linkedTemplate || !(linkedTemplate as any)?.working_paper_template
                                }
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
                  </CollapsibleContent>
                </Card>
              </Collapsible>
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
