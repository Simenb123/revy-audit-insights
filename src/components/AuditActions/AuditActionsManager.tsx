import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus } from 'lucide-react';
import {
  useClientAuditActions
} from '@/hooks/useAuditActions';

import ClientActionsList from './ClientActionsList';
import ActionProgressIndicator from './ActionProgressIndicator';

interface AuditActionsManagerProps {
  clientId: string;
  phase?: string;
}

const AuditActionsManager = ({ clientId, phase = 'execution' }: AuditActionsManagerProps) => {
  const { data: clientActions = [], isLoading: actionsLoading } = useClientAuditActions(clientId);

  // Calculate overall progress
  const totalActions = clientActions.length;
  const completedActions = clientActions.filter(action => action.status === 'completed').length;
  const overallProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;


  if (actionsLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Laster revisjonshandlinger...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      {totalActions > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={20} />
                Samlet fremdrift
              </CardTitle>
              <div className="text-2xl font-bold text-primary">
                {overallProgress}%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ActionProgressIndicator actions={clientActions} />
          </CardContent>
        </Card>
      )}

      <ClientActionsList
        actions={clientActions}
        clientId={clientId}
        phase={phase as any}
        onOpenTemplates={() => {}}
      />
    </div>
  );
};

export default AuditActionsManager;
