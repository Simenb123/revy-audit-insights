import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, CheckCircle } from 'lucide-react';
import { AuditActionTemplate, ClientAuditAction } from '@/types/audit-actions';
import ActionStatusBadge from '../ActionStatusBadge';
import ActionQuickActions from '../ActionQuickActions';
import { ACTION_STATUS_CONFIG } from '@/constants/actionConfig';

interface ActionCardProps {
  type: 'template' | 'client-action';
  data: AuditActionTemplate | ClientAuditAction;
  selected?: boolean;
  onToggle?: (id: string) => void;
  onEdit?: (data: AuditActionTemplate | ClientAuditAction) => void;
  onCopyToClient?: (id: string) => void;
  dragHandle?: React.ReactNode;
  showCheckbox?: boolean;
  showQuickActions?: boolean;
}

const ActionCard = ({
  type,
  data,
  selected = false,
  onToggle,
  onEdit,
  onCopyToClient,
  dragHandle,
  showCheckbox = true,
  showQuickActions = true,
}: ActionCardProps) => {
  const isClientAction = type === 'client-action';
  const clientAction = isClientAction ? (data as ClientAuditAction) : null;
  const template = !isClientAction ? (data as AuditActionTemplate) : null;

  const handleClick = () => {
    if (onEdit) {
      onEdit(data);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {showCheckbox && onToggle && (
            <div onClick={handleCheckboxClick} className="pt-1">
              <Checkbox 
                checked={selected} 
                onCheckedChange={() => onToggle(data.id)} 
              />
            </div>
          )}

          {dragHandle && (
            <div onClick={(e) => e.stopPropagation()}>{dragHandle}</div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base mb-1">{data.name}</h3>
                {data.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {data.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isClientAction && clientAction && (
                  <ActionStatusBadge status={clientAction.status} />
                )}
              </div>
            </div>

            {isClientAction && clientAction && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                {clientAction.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(clientAction.due_date).toLocaleDateString('no-NO')}</span>
                  </div>
                )}
                {clientAction.completed_at && (
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} className={ACTION_STATUS_CONFIG.completed.color} />
                    <span>{ACTION_STATUS_CONFIG.completed.label} {new Date(clientAction.completed_at).toLocaleDateString('no-NO')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
            {showQuickActions && isClientAction && clientAction && (
              <ActionQuickActions action={clientAction} onEdit={handleClick} />
            )}
            {!isClientAction && onCopyToClient && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyToClient(data.id);
                }}
                className="text-xs text-primary hover:underline"
              >
                Bruk
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionCard;
