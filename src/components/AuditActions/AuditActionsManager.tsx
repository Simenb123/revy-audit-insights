import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, BarChart3, Plus, Info } from 'lucide-react';
import {
  useAuditActionTemplates,
  useClientAuditActions,
  useCopyActionsFromTemplate,
  useApplyStandardPackage
} from '@/hooks/useAuditActions';

import ActionTemplateList from './ActionTemplateList';
import ClientActionsList from './ClientActionsList';
import CopyFromClientDialog from './CopyFromClientDialog';
import AddActionsDialog from './AddActionsDialog';
import ActionProgressIndicator from './ActionProgressIndicator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface AuditActionsManagerProps {
  clientId: string;
  phase?: string;
}

const AuditActionsManager = ({ clientId, phase = 'execution' }: AuditActionsManagerProps) => {
  
  const [addActionsOpen, setAddActionsOpen] = useState(false);
  const [copyFromClientOpen, setCopyFromClientOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('client-actions');
  const [helpDismissed, setHelpDismissed] = useLocalStorage<boolean>('audit-actions-help-dismissed', false);
  
  const { data: templates = [], isLoading: templatesLoading } = useAuditActionTemplates();
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
      {!helpDismissed && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Slik fungerer revisjonshandlinger</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              <li>Klienthandlinger er oppgavene som er kopiert inn for denne klienten.</li>
              <li>Handlingsmaler er biblioteket der du velger hva som kopieres inn.</li>
              <li>Hvilke maler du ser styres av applicable_phases og valgt fase.</li>
            </ul>
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setHelpDismissed(true)}>
                Skjul forklaring
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="client-actions">
            Klienthandlinger
          </TabsTrigger>
          <TabsTrigger value="templates" onClick={() => setActiveTab('templates')}>
            Handlingsmaler
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="client-actions" className="space-y-4">
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
            onOpenTemplates={() => setActiveTab('templates')}
          />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <ActionTemplateList
            templates={templates}
            phase={phase as string}
            onCopyToClient={handleCopyToClient}
          />
        </TabsContent>
      </Tabs>

      <AddActionsDialog
        open={addActionsOpen}
        onOpenChange={setAddActionsOpen}
        onSelectFromTemplates={() => setActiveTab('templates')}
        onCopyFromClient={() => setCopyFromClientOpen(true)}
      />

      <CopyFromClientDialog
        open={copyFromClientOpen}
        onOpenChange={setCopyFromClientOpen}
        targetClientId={clientId}
        phase={phase}
      />
    </div>
  );
};

export default AuditActionsManager;
