
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { ClientAuditAction } from '@/types/audit-actions';
import { ACTION_STATUS_CONFIG } from '@/constants/actionConfig';

interface ActionProgressIndicatorProps {
  actions: ClientAuditAction[];
}

const ActionProgressIndicator = ({ actions }: ActionProgressIndicatorProps) => {
  const totalActions = actions.length;
  const completedActions = actions.filter(action => action.status === 'completed').length;
  const inProgressActions = actions.filter(action => action.status === 'in_progress').length;
  const reviewedActions = actions.filter(action => action.status === 'reviewed').length;
  const notStartedActions = actions.filter(action => action.status === 'not_started').length;
  
  const progressPercentage = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  if (totalActions === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        Ingen handlinger funnet
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Fremdrift</h3>
        <span className="text-sm text-muted-foreground">
          {completedActions} av {totalActions} fullført
        </span>
      </div>
      
      <Progress value={progressPercentage} className="h-2" />
      
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="text-center">
          <div className={`font-medium ${ACTION_STATUS_CONFIG.not_started.color}`}>{notStartedActions}</div>
          <div className="text-muted-foreground">{ACTION_STATUS_CONFIG.not_started.label}</div>
        </div>
        <div className="text-center">
          <div className={`font-medium ${ACTION_STATUS_CONFIG.in_progress.color}`}>{inProgressActions}</div>
          <div className="text-muted-foreground">{ACTION_STATUS_CONFIG.in_progress.label}</div>
        </div>
        <div className="text-center">
          <div className={`font-medium ${ACTION_STATUS_CONFIG.reviewed.color}`}>{reviewedActions}</div>
          <div className="text-muted-foreground">{ACTION_STATUS_CONFIG.reviewed.label}</div>
        </div>
        <div className="text-center">
          <div className={`font-medium ${ACTION_STATUS_CONFIG.completed.color}`}>{completedActions}</div>
          <div className="text-muted-foreground">{ACTION_STATUS_CONFIG.completed.label}</div>
        </div>
      </div>
    </div>
  );
};

export default ActionProgressIndicator;
