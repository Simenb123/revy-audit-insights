import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, CheckCircle, ChevronDown, ChevronUp, Save, Lock } from 'lucide-react';
import { ClientAuditAction, ActionStatus } from '@/types/audit-actions';
import ActionStatusBadge from '../ActionStatusBadge';
import ActionQuickActions from '../ActionQuickActions';
import { ACTION_STATUS_CONFIG } from '@/constants/actionConfig';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUpdateClientAuditAction } from '@/hooks/useAuditActions';
import { useAuditActionTemplates } from '@/hooks/audit-actions/useActionTemplateCRUD';
import ResponseFieldsRenderer from '../ResponseFieldsRenderer';
import ActionComments from '../Comments/ActionComments';
import ActionStatusControl from '../ActionStatusControl';
import { toast } from 'sonner';

interface ExpandableActionCardProps {
  action: ClientAuditAction;
  selected?: boolean;
  onToggle?: (id: string) => void;
  dragHandle?: React.ReactNode;
  showCheckbox?: boolean;
}

const ExpandableActionCard = ({
  action,
  selected = false,
  onToggle,
  dragHandle,
  showCheckbox = true,
}: ExpandableActionCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const updateMutation = useUpdateClientAuditAction();
  const { data: actionTemplates = [] } = useAuditActionTemplates();
  
  const [status, setStatus] = useState<ActionStatus>(action.status);
  const [responseFieldValues, setResponseFieldValues] = useState<Record<string, any>>({});
  const [responseFieldErrors, setResponseFieldErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const templateId = (action?.template_id as string | undefined) || undefined;
  const actionTemplate = useMemo(
    () => actionTemplates.find((t: any) => t.id === templateId), 
    [actionTemplates, templateId]
  );

  useEffect(() => {
    setStatus(action.status);
    
    try {
      const wpData = (action as any).working_paper_data ?? {};
      const responseData = wpData.response_data || {};
      setResponseFieldValues(responseData);
    } catch {
      setResponseFieldValues({});
    }
    setHasChanges(false);
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
    if (!validateResponseFields()) {
      toast.error('Vennligst fyll ut alle obligatoriske felter');
      return;
    }

    try {
      const wpData = (action as any).working_paper_data ?? {};
      const updatedWpData = {
        ...wpData,
        response_data: responseFieldValues
      };

      await updateMutation.mutateAsync({
        id: action.id,
        updates: {
          status,
          working_paper_data: updatedWpData,
        } as any,
      });

      toast.success('Handlingen er oppdatert');
      setHasChanges(false);
    } catch (error) {
      toast.error('Kunne ikke oppdatere handlingen');
    }
  };

  const handleStatusChange = (newStatus: ActionStatus) => {
    if (newStatus === 'completed' && !validateResponseFields()) {
      toast.error('Fyll ut alle obligatoriske felter før du fullfører handlingen');
      return;
    }
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleResponseFieldChange = (fieldId: string, value: any) => {
    setResponseFieldValues((prev) => ({
      ...prev,
      [fieldId]: value
    }));
    setHasChanges(true);
    
    if (responseFieldErrors[fieldId]) {
      setResponseFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {showCheckbox && onToggle && (
              <div onClick={handleCheckboxClick} className="pt-1">
                <Checkbox 
                  checked={selected} 
                  onCheckedChange={() => onToggle(action.id)} 
                />
              </div>
            )}

            {dragHandle && (
              <div onClick={(e) => e.stopPropagation()}>{dragHandle}</div>
            )}

            <div className="flex-1 min-w-0">
              <CollapsibleTrigger asChild>
                <div className="cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-base">{action.name}</h3>
                        {actionTemplate?.is_system_template && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Lock size={12} />
                            Obligatorisk
                          </Badge>
                        )}
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      {action.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {action.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ActionStatusBadge status={action.status} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    {action.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(action.due_date).toLocaleDateString('no-NO')}</span>
                      </div>
                    )}
                    {action.completed_at && (
                      <div className="flex items-center gap-1">
                        <CheckCircle size={14} className={ACTION_STATUS_CONFIG.completed.color} />
                        <span>{ACTION_STATUS_CONFIG.completed.label} {new Date(action.completed_at).toLocaleDateString('no-NO')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-4 space-y-4">
                {/* Status Control */}
                <ActionStatusControl
                  currentStatus={status}
                  onStatusChange={handleStatusChange}
                  completionPercentage={calculateCompletionPercentage()}
                />

                {/* Procedures (Read only) */}
                {action.procedures && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <Label className="text-sm font-semibold">Prosedyrer</Label>
                    <div className="text-sm whitespace-pre-wrap mt-2">{action.procedures}</div>
                  </div>
                )}

                {/* Response Fields from Template */}
                {actionTemplate?.response_fields && actionTemplate.response_fields.length > 0 && (
                  <ResponseFieldsRenderer
                    fields={actionTemplate.response_fields}
                    values={responseFieldValues}
                    onChange={handleResponseFieldChange}
                    errors={responseFieldErrors}
                  />
                )}

                {/* Documents placeholder */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <Label className="text-sm font-semibold">Dokumenter</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vedlegg og dokumentasjon vil vises her
                  </p>
                </div>

                {/* Team Comments - only if enabled in template */}
                {(actionTemplate?.show_team_comments ?? true) && (
                  <ActionComments actionId={action.id} />
                )}

                {/* Save button */}
                {hasChanges && (
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Lagre endringer
                    </Button>
                  </div>
                )}
              </CollapsibleContent>
            </div>

            {/* Quick Actions */}
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
              <ActionQuickActions 
                action={action} 
                onEdit={() => setIsOpen(true)}
                isSystemTemplate={actionTemplate?.is_system_template ?? false}
              />
            </div>
          </div>
        </CardContent>
      </Collapsible>
    </Card>
  );
};

export default ExpandableActionCard;
