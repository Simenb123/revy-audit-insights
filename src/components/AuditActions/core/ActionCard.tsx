import React from 'react';
import { AuditActionTemplate, ClientAuditAction } from '@/types/audit-actions';
import ActionQuickActions from '../ActionQuickActions';
import ActionCardBase from './ActionCardBase';

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

  const handleClick = () => {
    if (onEdit) {
      onEdit(data);
    }
  };

  const actionButtons = (
    <>
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
    </>
  );

  // For templates, we need to cast to ClientAuditAction format for ActionCardBase
  const action = isClientAction 
    ? clientAction! 
    : { ...data, status: 'not_started' } as ClientAuditAction;

  return (
    <ActionCardBase
      action={action}
      selected={selected}
      onToggle={onToggle}
      dragHandle={dragHandle}
      showCheckbox={showCheckbox}
      onClick={handleClick}
      actionButtons={actionButtons}
    />
  );
};

export default ActionCard;
