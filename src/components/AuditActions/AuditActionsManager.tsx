
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AuditSubjectArea, SUBJECT_AREA_LABELS } from '@/types/audit-actions';
import {
  useAuditActionTemplates,
  useClientAuditActions,
  useCopyActionsFromTemplate
} from '@/hooks/useAuditActions';
import SubjectAreaNav from './SubjectAreaNav';
import ActionTemplateList from './ActionTemplateList';
import ClientActionsList from './ClientActionsList';
import { toast } from '@/hooks/use-toast';

interface AuditActionsManagerProps {
  clientId: string;
  phase?: string;
}

const AuditActionsManager = ({ clientId, phase = 'execution' }: AuditActionsManagerProps) => {
  const [selectedArea, setSelectedArea] = useState<AuditSubjectArea>('sales');
  
  const { data: templates = [], isLoading: templatesLoading } = useAuditActionTemplates();
  const { data: clientActions = [], isLoading: actionsLoading } = useClientAuditActions(clientId);
  const copyActionsMutation = useCopyActionsFromTemplate();

  // Calculate action counts per subject area
  const actionCounts = clientActions.reduce((acc, action) => {
    acc[action.subject_area] = (acc[action.subject_area] || 0) + 1;
    return acc;
  }, {} as Record<AuditSubjectArea, number>);

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
            Klienthandlinger ({SUBJECT_AREA_LABELS[selectedArea]})
          </TabsTrigger>
          <TabsTrigger value="templates">
            Handlingsmaler ({SUBJECT_AREA_LABELS[selectedArea]})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="client-actions" className="space-y-4">
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
    </div>
  );
};

export default AuditActionsManager;
