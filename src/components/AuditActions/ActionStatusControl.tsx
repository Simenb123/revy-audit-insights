import React from 'react';
import { Button } from '@/components/ui/button';
import type { ActionStatus } from '@/types/audit-actions';
import { ACTION_STATUS_CONFIG } from '@/constants/actionConfig';

interface ActionStatusControlProps {
  currentStatus: ActionStatus;
  onStatusChange: (status: ActionStatus) => void;
  completionPercentage?: number;
}

// Map nextStatus for workflow progression
const statusFlow: Record<ActionStatus, ActionStatus> = {
  not_started: 'in_progress',
  in_progress: 'completed',
  completed: 'reviewed',
  reviewed: 'approved',
  approved: 'approved'
};

export const ActionStatusControl: React.FC<ActionStatusControlProps> = ({
  currentStatus,
  onStatusChange,
  completionPercentage = 0
}) => {
  const config = ACTION_STATUS_CONFIG[currentStatus];
  const Icon = config.icon;
  const nextStatus = statusFlow[currentStatus];

  const getNextStatusLabel = () => {
    if (currentStatus === 'not_started') return 'Start arbeid';
    if (currentStatus === 'in_progress') return 'Marker som fullført';
    if (currentStatus === 'completed') return 'Send til gjennomgang';
    if (currentStatus === 'reviewed') return 'Godkjenn';
    return 'Godkjent';
  };

  const canProgress = currentStatus !== 'approved';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <div className="text-sm font-medium">{config.label}</div>
            {completionPercentage > 0 && completionPercentage < 100 && (
              <div className="text-xs text-muted-foreground">
                {completionPercentage}% fullført
              </div>
            )}
          </div>
        </div>

        {canProgress && (
          <Button
            onClick={() => onStatusChange(nextStatus)}
            size="sm"
            variant={currentStatus === 'in_progress' ? 'default' : 'outline'}
          >
            {getNextStatusLabel()}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {completionPercentage > 0 && completionPercentage < 100 && (
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      )}

      {/* Status timeline */}
      <div className="flex items-center gap-2 pt-2">
        {(Object.keys(ACTION_STATUS_CONFIG) as ActionStatus[]).map((status) => {
          const isActive = status === currentStatus;
          const statusOrder = ['not_started', 'in_progress', 'completed', 'reviewed', 'approved'];
          const isPast = statusOrder.indexOf(status) < statusOrder.indexOf(currentStatus);
          
          return (
            <div
              key={status}
              className={`flex-1 h-1 rounded-full transition-all ${
                isActive ? 'bg-primary' : isPast ? 'bg-muted-foreground' : 'bg-muted'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ActionStatusControl;
