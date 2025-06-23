import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentsContainer from './Documents/DocumentsContainer';
import PlanningContainer from './Planning/PlanningContainer';
import ActionsContainer from './Actions/ActionsContainer';
import { AuditPhase } from '@/types/client';

interface PhaseContentProps {
  clientId: string;
  phase: AuditPhase;
}

const PhaseContent: React.FC<PhaseContentProps> = ({ clientId, phase }) => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Oversikt</TabsTrigger>
        <TabsTrigger value="planning">Planlegging</TabsTrigger>
        <TabsTrigger value="actions">Handlinger</TabsTrigger>
        <TabsTrigger value="documents">Dokumenter</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Overview content */}
        </div>
      </TabsContent>

      <TabsContent value="planning">
        <PlanningContainer clientId={clientId} />
      </TabsContent>

      <TabsContent value="actions">
        <ActionsContainer clientId={clientId} />
      </TabsContent>

      <TabsContent value="documents">
        <DocumentsContainer clientId={clientId} />
      </TabsContent>
    </Tabs>
  );
};

export default PhaseContent;
