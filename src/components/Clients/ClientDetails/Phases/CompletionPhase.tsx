import React from 'react';
import { Client } from '@/types/revio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ActionsContainer from '../Actions/ActionsContainer';

interface CompletionPhaseProps {
  client: Client;
}

const CompletionPhase = ({ client }: CompletionPhaseProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fullføringsfase</CardTitle>
          <CardDescription>
            Avslutning av arbeidsprogrammer og evalueringer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            I denne fasen avsluttes arbeidsprogrammene og evalueringene.
          </p>
        </CardContent>
      </Card>
      
      <ActionsContainer clientId={client.id} phase="completion" />
    </div>
  );
};

export default CompletionPhase;