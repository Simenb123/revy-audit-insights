
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, BarChart3 } from 'lucide-react';
import {
  useAuditActionTemplates,
  useClientAuditActions,
  useCopyActionsFromTemplate
} from '@/hooks/useAuditActions';
import SubjectAreaNav from './SubjectAreaNav';
import ActionTemplateList from './ActionTemplateList';
import ClientActionsList from './ClientActionsList';
import CopyFromClientDialog from './CopyFromClientDialog';
import ActionProgressIndicator from './ActionProgressIndicator';

interface AuditActionsManagerProps {
  clientId: string;
  phase?: string;
}

const AuditActionsManager = ({ clientId, phase = 'execution' }: AuditActionsManagerProps) => {
  const [selectedArea, setSelectedArea] = useState<string>('sales');
  const [copyFromClientOpen, setCopyFromClientOpen] = useState(false);
  
  const { data: templates = [], isLoading: templatesLoading } = useAuditActionTemplates();
  const { data: clientActions = [], isLoading: actionsLoading } = useClientAuditActions(clientId);
  const copyActionsMutation = useCopyActionsFromTemplate();

  // Calculate action counts per subject area
  const actionCounts = clientActions.reduce((acc, action) => {
    acc[action.subject_area] = (acc[action.subject_area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
      console.error('Error copying actions:', error);
    }
  };

  // Get the display name for the selected area
  const getSelectedAreaLabel = (areaKey: string) => {
    // This would need to be updated to get the display name from subject areas
    // For now, we'll use a fallback
    const areaLabels: Record<string, string> = {
      sales: 'Salg',
      payroll: 'Lønn',
      operating_expenses: 'Driftskostnader',
      inventory: 'Varelager',
      finance: 'Finans',
      banking: 'Bank',
      fixed_assets: 'Anleggsmidler',
      receivables: 'Kundefordringer',
      payables: 'Leverandørgjeld',
      equity: 'Egenkapital',
      other: 'Annet'
    };
    return areaLabels[areaKey] || areaKey;
  };

  if (templatesLoading || actionsLoading) {
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

      <Card>
        <CardHeader>
          <CardTitle>Revisjonshandlinger - Fagområder</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectAreaNav
            selectedArea={selectedArea}
            onAreaSelect={setSelectedArea}
            actionCounts={actionCounts}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="client-actions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="client-actions">
            Klienthandlinger ({getSelectedAreaLabel(selectedArea)})
          </TabsTrigger>
          <TabsTrigger value="templates">
            Handlingsmaler ({getSelectedAreaLabel(selectedArea)})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="client-actions" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setCopyFromClientOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Copy size={16} />
              Kopier fra annen klient
            </Button>
          </div>
          
          <ClientActionsList
            actions={clientActions}
            selectedArea={selectedArea}
          />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <ActionTemplateList
            templates={templates}
            selectedArea={selectedArea}
            onCopyToClient={handleCopyToClient}
          />
        </TabsContent>
      </Tabs>

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

export default AuditActionsManager;
