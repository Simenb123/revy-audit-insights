import React from 'react';
import { Client } from '@/types/revio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ActionsContainer from '../Actions/ActionsContainer';

interface ReportingPhaseProps {
  client: Client;
}

const ReportingPhase = ({ client }: ReportingPhaseProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rapporteringsfase</CardTitle>
          <CardDescription>
            Utstedelse av revisjonsberetning og kommunikasjon av resultater
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            I denne fasen utstedes revisjonsberetningen og resultatene kommuniseres.
          </p>
        </CardContent>
      </Card>
      
      <ActionsContainer clientId={client.id} phase="reporting" />
    </div>
  );
};

export default ReportingPhase;