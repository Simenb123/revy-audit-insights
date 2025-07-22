import React from 'react';
import { Client } from '@/types/revio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ActionsContainer from '../Actions/ActionsContainer';

interface ExecutionPhaseProps {
  client: Client;
}

const ExecutionPhase = ({ client }: ExecutionPhaseProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gjennomføringsfase</CardTitle>
          <CardDescription>
            Utføring av substansielle tester og kontrolltester
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            I denne fasen utføres substansielle tester og kontrolltester.
          </p>
        </CardContent>
      </Card>
      
      <ActionsContainer clientId={client.id} phase="execution" />
    </div>
  );
};

export default ExecutionPhase;