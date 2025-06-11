
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { ClientAuditAction } from '@/types/audit-actions';

interface ActionProgressIndicatorProps {
  actions: ClientAuditAction[];
}

const ActionProgressIndicator = ({ actions }: ActionProgressIndicatorProps) => {
  const totalActions = actions.length;
  const completedActions = actions.filter(action => action.status === 'completed').length;
  const inProgressActions = actions.filter(action => action.status === 'in_progress').length;
  const underReviewActions = actions.filter(action => action.status === 'under_review').length;
  
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
          <div className="font-medium">{actions.filter(a => a.status === 'not_started').length}</div>
          <div className="text-muted-foreground">Ikke startet</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-blue-600">{inProgressActions}</div>
          <div className="text-muted-foreground">Pågående</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-orange-600">{underReviewActions}</div>
          <div className="text-muted-foreground">Gjennomgang</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-green-600">{completedActions}</div>
          <div className="text-muted-foreground">Fullført</div>
        </div>
      </div>
    </div>
  );
};

export default ActionProgressIndicator;
