import React from 'react';
import { Client } from '@/types/revio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ActionsContainer from '../Actions/ActionsContainer';

interface PlanningPhaseProps {
  client: Client;
}

const PlanningPhase = ({ client }: PlanningPhaseProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planleggingsfase</CardTitle>
          <CardDescription>
            Utforming av revisjonsstrategi og identifisering av fokusområder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            I denne fasen planlegges revisjonsstrategien og fokusområdene identifiseres.
          </p>
        </CardContent>
      </Card>
      
      <ActionsContainer clientId={client.id} phase="planning" />
    </div>
  );
};

export default PlanningPhase;