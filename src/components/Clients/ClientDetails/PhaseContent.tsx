
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, FileText, BookOpen } from "lucide-react";
import DocumentsContainer from "./Documents/DocumentsContainer";
import PlanningContainer from "./Planning/PlanningContainer";
import ActionsContainer from "./Actions/ActionsContainer";
import { AuditPhase } from "@/types/revio";
import { Client } from "@/types/revio";
import { useClientAuditActions } from "@/hooks/useAuditActions";
import { phaseInfo } from "@/constants/phaseInfo";
import Overview from "./ClientDashboard/Overview";

interface PhaseContentProps {
  phase: AuditPhase;
  client: Client;
}


const PhaseContent: React.FC<PhaseContentProps> = ({ phase, client }) => {
  const { data: clientActions = [] } = useClientAuditActions(client.id);
  const info = phaseInfo[phase];
  const IconComponent = info.icon;
  
  // Count actions for this phase
  const phaseActions = clientActions.filter(action => action.phase === phase);
  const completedActions = phaseActions.filter(action => action.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${info.color.split(' ')[0]} bg-opacity-20`}>
                <IconComponent className={`w-5 h-5 ${info.color.split(' ')[1]}`} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {info.label}
                  <Badge className={info.color}>
                    Aktiv fase
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {info.description}
                </p>
              </div>
            </div>
            
            {phaseActions.length > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {completedActions.length}/{phaseActions.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  handlinger fullført
                </p>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Phase Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="actions" className="gap-2">
            <Target className="w-4 h-4" />
            Handlinger
            {phaseActions.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {phaseActions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 w-4" />
            Dokumenter
          </TabsTrigger>
          <TabsTrigger value="planning" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Planlegging
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Overview 
            client={client}
            documentCount={0}
            nextAuditDeadline="Ikke angitt"
          />
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <ActionsContainer clientId={client.id} phase={phase} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsContainer
            clientId={client.id}
            clientName={client.company_name || client.name}
          />
        </TabsContent>

        <TabsContent value="planning">
          <PlanningContainer clientId={client.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhaseContent;
