import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus } from 'lucide-react';
import {
  useClientAuditActions,
  useCopyActionsFromTemplate,
  useApplyStandardPackage
} from '@/hooks/useAuditActions';

import ClientActionsList from './ClientActionsList';
import AddActionsDialog from './AddActionsDialog';
import ActionProgressIndicator from './ActionProgressIndicator';

interface AuditActionsManagerProps {
  clientId: string;
  phase?: string;
}

const AuditActionsManager = ({ clientId, phase = 'execution' }: AuditActionsManagerProps) => {
  
  const [addActionsOpen, setAddActionsOpen] = useState(false);
  
  const { data: clientActions = [], isLoading: actionsLoading } = useClientAuditActions(clientId);
  const copyActionsMutation = useCopyActionsFromTemplate();
  const applyStandardMutation = useApplyStandardPackage();


  // Calculate overall progress
  const totalActions = clientActions.length;
  const completedActions = clientActions.filter(action => action.status === 'completed').length;
  const overallProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const handleCopyToClient = async (templateIds: string[]) => {
    try {
      await copyActionsMutation.mutateAsync({
        clientId,
        templateIds,
        phase
      });
    } catch (error) {
      logger.error('Error copying actions:', error);
    }
  };


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

      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          {['engagement', 'planning'].includes(phase as string) && (
            <Button
              onClick={async () => {
                try {
                  await applyStandardMutation.mutateAsync({ clientId, phase: phase as any });
                } catch (e) {
                  logger.error('Failed to apply standard package', e);
                }
              }}
              size="sm"
              className="gap-2"
              disabled={applyStandardMutation.isPending}
            >
              <Plus size={16} />
              Legg til standardpakke
            </Button>
          )}
          <Button
            onClick={() => setAddActionsOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus size={16} />
            Legg til handlinger
          </Button>
        </div>
        
        <ClientActionsList
          actions={clientActions}
          clientId={clientId}
          phase={phase as any}
          onOpenTemplates={() => setAddActionsOpen(true)}
        />
      </div>

      <AddActionsDialog
        open={addActionsOpen}
        onOpenChange={setAddActionsOpen}
        clientId={clientId}
        phase={phase}
        onCopyToClient={handleCopyToClient}
      />
    </div>
  );
};

export default AuditActionsManager;
