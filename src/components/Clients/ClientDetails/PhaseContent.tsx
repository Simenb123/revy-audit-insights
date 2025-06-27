import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentsContainer from "./Documents/DocumentsContainer";
import PlanningContainer from "./Planning/PlanningContainer";
import ActionsContainer from "./Actions/ActionsContainer";
import { AuditPhase } from "@/types/revio";
import { Client } from "@/types/revio";

interface PhaseContentProps {
  phase: AuditPhase;
  client: Client;
}

const PhaseContent: React.FC<PhaseContentProps> = ({ phase, client }) => {
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
        <PlanningContainer clientId={client.id} />
      </TabsContent>

      <TabsContent value="actions">
        <ActionsContainer clientId={client.id} phase={phase} />
      </TabsContent>

      <TabsContent value="documents">
        <DocumentsContainer
          clientId={client.id}
          clientName={client.company_name || client.name}
        />
      </TabsContent>
    </Tabs>
  );
};

export default PhaseContent;
