import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Save, Lock } from 'lucide-react';
import { ClientAuditAction } from '@/types/audit-actions';
import ActionQuickActions from '../ActionQuickActions';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuditActionTemplates } from '@/hooks/audit-actions/useActionTemplateCRUD';
import ResponseFieldsRenderer from '../ResponseFieldsRenderer';
import ActionComments from '../Comments/ActionComments';
import ActionStatusControl from '../ActionStatusControl';
import { useActionEditor } from '@/hooks/audit-actions/useActionEditor';
import ActionCardBase from './ActionCardBase';

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
  const { data: actionTemplates = [] } = useAuditActionTemplates();

  const templateId = (action?.template_id as string | undefined) || undefined;
  const actionTemplate = useMemo(
    () => actionTemplates.find((t: any) => t.id === templateId), 
    [actionTemplates, templateId]
  );

  // Use the consolidated action editor hook
  const {
    status,
    responseFieldValues,
    responseFieldErrors,
    hasChanges,
    isUpdating,
    handleStatusChange,
    handleResponseFieldChange,
    handleSave,
    getCompletionPercentage,
  } = useActionEditor(action, actionTemplate?.response_fields);

  const headerContent = (
    <div className="flex items-center gap-2 mt-1">
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
  );

  const actionButtons = (
    <ActionQuickActions 
      action={action} 
      onEdit={() => setIsOpen(true)}
      isSystemTemplate={actionTemplate?.is_system_template ?? false}
    />
  );

  const expandableContent = (
    <CollapsibleContent className="mt-4 space-y-4">
      {/* Status Control */}
      <ActionStatusControl
        currentStatus={status}
        onStatusChange={handleStatusChange}
        completionPercentage={getCompletionPercentage()}
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
            disabled={isUpdating}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Lagre endringer
          </Button>
        </div>
      )}
    </CollapsibleContent>
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <ActionCardBase
        action={action}
        selected={selected}
        onToggle={onToggle}
        dragHandle={dragHandle}
        showCheckbox={showCheckbox}
        headerContent={
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer">
              {headerContent}
            </div>
          </CollapsibleTrigger>
        }
        actionButtons={actionButtons}
        className=""
      >
        {expandableContent}
      </ActionCardBase>
    </Collapsible>
  );
};

export default ExpandableActionCard;
