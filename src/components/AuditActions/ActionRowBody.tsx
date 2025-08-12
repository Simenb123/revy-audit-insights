import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import ActionStatusBadge from './ActionStatusBadge';
import ActionQuickActions from './ActionQuickActions';
import { ClientAuditAction } from '@/types/audit-actions';

interface ActionRowBodyProps {
  action: ClientAuditAction;
  selected: boolean;
  onToggle: (id: string) => void;
  onEdit: (action: ClientAuditAction) => void;
  dragHandle?: React.ReactNode;
}

const ActionRowBody: React.FC<ActionRowBodyProps> = ({ action, selected, onToggle, onEdit, dragHandle }) => {
  return (
    <div
      className="border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => onEdit(action)}
    >
      <div className="flex items-start gap-3">
        <div onClick={(e) => e.stopPropagation()} className="pt-1">
          <Checkbox checked={selected} onCheckedChange={() => onToggle(action.id)} />
        </div>

        {dragHandle && (
          <div onClick={(e) => e.stopPropagation()}>{dragHandle}</div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-sm truncate">{action.name}</h3>
            <ActionStatusBadge status={action.status} />
          </div>
          {action.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{action.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">{action.action_type}</Badge>
            </span>
            {action.estimated_hours && (<span>Estimat: {action.estimated_hours}t</span>)}
            {action.actual_hours && (<span>Faktisk: {action.actual_hours}t</span>)}
          </div>
          {action.due_date && (
            <div className="text-xs text-muted-foreground mt-1">
              Forfaller: {new Date(action.due_date).toLocaleDateString('no-NO')}
            </div>
          )}
          {action.completed_at && (
            <div className="text-xs text-green-600 mt-1">
              Fullført: {new Date(action.completed_at).toLocaleDateString('no-NO')}
            </div>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <ActionQuickActions action={action} onEdit={() => onEdit(action)} />
        </div>
      </div>
    </div>
  );
};

export default ActionRowBody;
