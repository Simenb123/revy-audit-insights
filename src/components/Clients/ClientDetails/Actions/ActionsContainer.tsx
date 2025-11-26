import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Plus, 
  Library,
  CheckCircle,
  Clock,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { AuditPhase } from '@/types/revio';
import { 
  useClientAuditActions, 
  useAuditActionTemplates,
  useCopyActionsFromTemplate
} from '@/hooks/useAuditActions';
import ClientActionsList from '@/components/AuditActions/ClientActionsList';
import ActionTemplateList from '@/components/AuditActions/ActionTemplateList';
import { getPhaseLabel } from '@/constants/auditPhases';
import SmartActionRecommendations from '@/components/AuditActions/SmartActionRecommendations';
import { AuditActionsProvider } from '@/contexts/AuditActionsContext';
import { toast } from 'sonner';

interface ActionsContainerProps {
  clientId: string;
  phase: AuditPhase;
}

const ActionsContainer = ({ clientId, phase }: ActionsContainerProps) => {
  const [activeTab, setActiveTab] = useState<string>('actions');
  
  const { data: clientActions = [], isLoading: actionsLoading } = useClientAuditActions(clientId);
  const { data: templates = [], isLoading: templatesLoading } = useAuditActionTemplates();
  const copyActionsMutation = useCopyActionsFromTemplate();

  // Filter actions for current phase
  const phaseActions = clientActions.filter(action => action.phase === phase);
  const phaseTemplates = templates.filter(template => 
    template.applicable_phases.includes(phase)
  );


const completedActions = phaseActions.filter(action => action.status === 'completed');
const inProgressActions = phaseActions.filter(action => action.status === 'in_progress');
const notStartedActions = phaseActions.filter(action => action.status === 'not_started');


  const handleCopyTemplates = async (templateIds: string[]) => {
    try {
      const inserted = await copyActionsMutation.mutateAsync({
        clientId,
        templateIds,
        phase
      });
      setActiveTab('actions');
      toast.success('Maler kopiert til klienten');
    } catch (error) {
      logger.error('Error copying templates:', error);
    }
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
    <AuditActionsProvider>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="actions" className="gap-2">
                <Target className="w-4 h-4" />
                Mine handlinger ({phaseActions.length})
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="gap-2">
                <Lightbulb className="w-4 h-4" />
                Anbefalinger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="space-y-4">
              {phaseActions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Ingen handlinger for {getPhaseLabel(phase).toLowerCase()}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Legg til handlinger fra malbiblioteket
                    </p>
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
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <SmartActionRecommendations clientId={clientId} phase={phase} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </AuditActionsProvider>
  );
};

export default ActionsContainer;
