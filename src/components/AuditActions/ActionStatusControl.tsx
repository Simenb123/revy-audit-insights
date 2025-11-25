import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Play, Pause, Award } from 'lucide-react';
import type { ActionStatus } from '@/types/audit-actions';

interface ActionStatusControlProps {
  currentStatus: ActionStatus;
  onStatusChange: (status: ActionStatus) => void;
  completionPercentage?: number;
}

const statusConfig = {
  not_started: {
    label: 'Ikke startet',
    icon: Pause,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    nextStatus: 'in_progress' as ActionStatus
  },
  in_progress: {
    label: 'Pågående',
    icon: Play,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    nextStatus: 'completed' as ActionStatus
  },
  completed: {
    label: 'Fullført',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900',
    nextStatus: 'reviewed' as ActionStatus
  },
  reviewed: {
    label: 'Under gjennomgang',
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    nextStatus: 'approved' as ActionStatus
  },
  approved: {
    label: 'Godkjent',
    icon: Award,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    nextStatus: 'approved' as ActionStatus
  }
};

export const ActionStatusControl: React.FC<ActionStatusControlProps> = ({
  currentStatus,
  onStatusChange,
  completionPercentage = 0
}) => {
  const config = statusConfig[currentStatus];
  const Icon = config.icon;

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
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
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
            onClick={() => onStatusChange(config.nextStatus)}
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
        {Object.entries(statusConfig).map(([status, cfg]) => {
          const isActive = status === currentStatus;
          const isPast = ['not_started', 'in_progress', 'completed', 'reviewed', 'approved']
            .indexOf(status as ActionStatus) <
            ['not_started', 'in_progress', 'completed', 'reviewed', 'approved']
            .indexOf(currentStatus);
          
          return (
            <div
              key={status}
              className={`flex-1 h-1 rounded-full transition-all ${
                isActive ? cfg.bgColor : isPast ? 'bg-muted-foreground' : 'bg-muted'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ActionStatusControl;
