
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Plus, 
  Copy, 
  Library,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { AuditPhase } from '@/types/revio';
import { 
  useClientAuditActions, 
  useAuditActionTemplates,
  useCopyActionsFromTemplate 
} from '@/hooks/useAuditActions';
import ClientActionsList from '@/components/AuditActions/ClientActionsList';
import ActionTemplateList from '@/components/AuditActions/ActionTemplateList';
import CopyFromClientDialog from '@/components/AuditActions/CopyFromClientDialog';

interface ActionsContainerProps {
  clientId: string;
  phase: AuditPhase;
}

const ActionsContainer = ({ clientId, phase }: ActionsContainerProps) => {
  const [copyFromClientOpen, setCopyFromClientOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('sales');
  
  const { data: clientActions = [], isLoading: actionsLoading } = useClientAuditActions(clientId);
  const { data: templates = [], isLoading: templatesLoading } = useAuditActionTemplates();
  const copyActionsMutation = useCopyActionsFromTemplate();

  // Filter actions for current phase
  const phaseActions = clientActions.filter(action => action.phase === phase);
  const phaseTemplates = templates.filter(template => 
    template.applicable_phases.includes(phase)
  );

  // Calculate statistics
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
    } catch (error) {
      console.error('Error copying templates:', error);
    }
  };

  const getPhaseLabel = (phase: AuditPhase): string => {
    const labels: Record<AuditPhase, string> = {
      overview: 'Oversikt',
      engagement: 'Oppdragsvurdering',
      planning: 'Planlegging',
      risk_assessment: 'Risikovurdering',
      execution: 'Utførelse',
      completion: 'Avslutning',
      reporting: 'Rapportering'
    };
    return labels[phase] || phase;
  };

  if (actionsLoading || templatesLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          Laster handlinger...
        </CardContent>
      </Card>
    );
  }

  return (
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
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Revisjonshandlinger - {getPhaseLabel(phase)}
            <Badge variant="secondary">
              {phaseActions.length} handlinger
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="actions" className="gap-2">
                <Target className="w-4 h-4" />
                Mine handlinger ({phaseActions.length})
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <Library className="w-4 h-4" />
                Tilgjengelige maler ({phaseTemplates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setCopyFromClientOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Kopier fra annen klient
                </Button>
              </div>

              {phaseActions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Ingen handlinger for {getPhaseLabel(phase).toLowerCase()}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Legg til handlinger fra maler eller kopier fra en annen klient
                    </p>
                    <Button 
                      onClick={() => setCopyFromClientOpen(true)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Legg til handlinger
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ClientActionsList
                  actions={phaseActions}
                  selectedArea={selectedArea}
                />
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              {phaseTemplates.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Library className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Ingen maler tilgjengelig
                    </h3>
                    <p className="text-muted-foreground">
                      Det finnes ingen handlingsmaler for {getPhaseLabel(phase).toLowerCase()}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ActionTemplateList
                  templates={phaseTemplates}
                  selectedArea={selectedArea}
                  onCopyToClient={handleCopyTemplates}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CopyFromClientDialog
        open={copyFromClientOpen}
        onOpenChange={setCopyFromClientOpen}
        targetClientId={clientId}
        selectedArea={selectedArea}
        phase={phase}
      />
    </div>
  );
};

export default ActionsContainer;
