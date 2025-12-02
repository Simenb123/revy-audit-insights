import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, CheckCircle } from 'lucide-react';
import { ClientAuditAction } from '@/types/audit-actions';
import ActionStatusBadge from '../ActionStatusBadge';
import { ACTION_STATUS_CONFIG } from '@/constants/actionConfig';

export interface ActionCardBaseProps {
  action: ClientAuditAction;
  selected?: boolean;
  onToggle?: (id: string) => void;
  dragHandle?: React.ReactNode;
  showCheckbox?: boolean;
  onClick?: () => void;
  headerContent?: React.ReactNode;
  actionButtons?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Base component for all action cards providing common layout and functionality
 */
const ActionCardBase = ({
  action,
  selected = false,
  onToggle,
  dragHandle,
  showCheckbox = true,
  onClick,
  headerContent,
  actionButtons,
  children,
  className = '',
}: ActionCardBaseProps) => {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card 
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          {showCheckbox && onToggle && (
            <div onClick={handleCheckboxClick} className="pt-1">
              <Checkbox 
                checked={selected} 
                onCheckedChange={() => onToggle(action.id)} 
              />
            </div>
          )}

          {/* Drag Handle */}
          {dragHandle && (
            <div onClick={(e) => e.stopPropagation()}>{dragHandle}</div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header Section */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base mb-1">{action.name}</h3>
                {action.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {action.description}
                  </p>
                )}
                {headerContent}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ActionStatusBadge status={action.status} />
              </div>
            </div>

            {/* Metadata Section */}
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

            {/* Expandable/Additional Content */}
            {children}
          </div>

          {/* Action Buttons */}
          {actionButtons && (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
              {actionButtons}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionCardBase;
