import React from 'react';
import { Client } from '@/types/revio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ActionsContainer from '../Actions/ActionsContainer';

interface EngagementPhaseProps {
  client: Client;
}

const EngagementPhase = ({ client }: EngagementPhaseProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Oppdragsfase</CardTitle>
          <CardDescription>
            Klientaksept og etablering av oppdragsvilkår
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            I denne fasen etableres oppdraget og vilkårene for revisjonen.
          </p>
        </CardContent>
      </Card>
      
      <ActionsContainer clientId={client.id} phase="engagement" />
    </div>
  );
};

export default EngagementPhase;