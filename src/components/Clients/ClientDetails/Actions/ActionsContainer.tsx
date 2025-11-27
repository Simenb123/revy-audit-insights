import { logger } from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Plus, 
  Library,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import AddActionsDialog from '@/components/AuditActions/AddActionsDialog';
import { AuditPhase } from '@/types/revio';
import { 
  useClientAuditActions, 
  useAuditActionTemplates,
  useCopyActionsFromTemplate
} from '@/hooks/useAuditActions';
import { useDeleteOldClientActions } from '@/hooks/useDeleteOldClientActions';
import ClientActionsList from '@/components/AuditActions/ClientActionsList';
import ActionTemplateList from '@/components/AuditActions/ActionTemplateList';
import { getPhaseLabel } from '@/constants/auditPhases';
import { AuditActionsProvider } from '@/contexts/AuditActionsContext';
import { toast } from 'sonner';

interface ActionsContainerProps {
  clientId: string;
  phase: AuditPhase;
}

const ActionsContainer = ({ clientId, phase }: ActionsContainerProps) => {
  const [addFromTemplatesOpen, setAddFromTemplatesOpen] = useState(false);
  const [autoCreatingActions, setAutoCreatingActions] = useState(false);
  
  const { data: clientActions = [], isLoading: actionsLoading } = useClientAuditActions(clientId);
  const { data: templates = [], isLoading: templatesLoading } = useAuditActionTemplates();
  const copyActionsMutation = useCopyActionsFromTemplate();
  const deleteOldActions = useDeleteOldClientActions();

  // Auto-cleanup: delete old actions without template_id on mount
  useEffect(() => {
    const hasOldActions = clientActions.some(action => !action.template_id);
    if (hasOldActions && !deleteOldActions.isPending) {
      deleteOldActions.mutate(clientId);
    }
  }, [clientActions, clientId, deleteOldActions]);

  // Filter actions for current phase
  const phaseActions = clientActions.filter(action => action.phase === phase);
  const phaseTemplates = templates.filter(template => 
    template.applicable_phases.includes(phase)
  );

  // Auto-create system templates when phase has no actions
  useEffect(() => {
    // Wait for data to load
    if (actionsLoading || templatesLoading || autoCreatingActions) return;
    
    // Find system templates for this phase
    const systemTemplates = phaseTemplates.filter(t => t.is_system_template);
    
    // If no system templates exist, nothing to auto-create
    if (systemTemplates.length === 0) return;
    
    // Check if any system templates are missing (haven't been copied yet)
    const existingTemplateIds = clientActions
      .filter(a => a.template_id)
      .map(a => a.template_id);
    
    const missingSystemTemplates = systemTemplates.filter(
      t => !existingTemplateIds.includes(t.id)
    );
    
    // Auto-copy missing system templates
    if (missingSystemTemplates.length > 0) {
      setAutoCreatingActions(true);
      copyActionsMutation.mutateAsync({
        clientId,
        templateIds: missingSystemTemplates.map(t => t.id),
        phase
      }).then(() => {
        toast.success(`${missingSystemTemplates.length} standard handlinger lagt til automatisk`);
        setAutoCreatingActions(false);
      }).catch((error) => {
        logger.error('Error auto-creating system templates:', error);
        toast.error('Kunne ikke legge til standard handlinger');
        setAutoCreatingActions(false);
      });
    }
  }, [actionsLoading, templatesLoading, phaseActions, phaseTemplates, clientActions, clientId, phase, copyActionsMutation, autoCreatingActions]);


const completedActions = phaseActions.filter(action => action.status === 'completed');
const inProgressActions = phaseActions.filter(action => action.status === 'in_progress');
const notStartedActions = phaseActions.filter(action => action.status === 'not_started');


  const handleCopyTemplates = async (templateIds: string[]) => {
    try {
      await copyActionsMutation.mutateAsync({
        clientId,
        templateIds,
        phase
      });
      setAddFromTemplatesOpen(false);
      toast.success('Maler kopiert til klienten');
    } catch (error) {
      logger.error('Error copying templates:', error);
    }
  };

  if (actionsLoading || templatesLoading || autoCreatingActions) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          {autoCreatingActions ? 'Legger til standard handlinger...' : 'Laster handlinger...'}
        </CardContent>
      </Card>
    );
  }

  return (
    <AuditActionsProvider actions={clientActions}>
      <div className="space-y-6">
      {/* Phase Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{phaseActions.length}</div>
                <p className="text-sm text-muted-foreground">Totalt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{completedActions.length}</div>
                <p className="text-sm text-muted-foreground">Fullført</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{inProgressActions.length}</div>
                <p className="text-sm text-muted-foreground">Pågår</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-600" />
              <div>
                <div className="text-2xl font-bold text-gray-600">{notStartedActions.length}</div>
                <p className="text-sm text-muted-foreground">Ikke startet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Revisjonshandlinger - {getPhaseLabel(phase)}
              <Badge variant="secondary">
                {phaseActions.length} handlinger
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={() => setAddFromTemplatesOpen(true)}
                variant="outline"
                size="sm"
              >
                <Library className="w-4 h-4 mr-2" />
                Legg til fra maler
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {phaseActions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <div>
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Ingen handlinger for {getPhaseLabel(phase).toLowerCase()}
                  </h3>
                  <p className="text-muted-foreground">
                    Standard handlinger vil bli lagt til automatisk når du besøker denne fasen
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ClientActionsList
              actions={phaseActions}
              clientId={clientId}
              phase={phase}
              onOpenTemplates={() => {}}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Actions Dialog */}
      <AddActionsDialog
        open={addFromTemplatesOpen}
        onOpenChange={setAddFromTemplatesOpen}
        clientId={clientId}
        phase={phase}
        onCopyToClient={handleCopyTemplates}
      />
      </div>
    </AuditActionsProvider>
  );
};

export default ActionsContainer;
