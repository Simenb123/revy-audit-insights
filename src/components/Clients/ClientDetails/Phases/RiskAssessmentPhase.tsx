import React from 'react';
import { Client } from '@/types/revio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ActionsContainer from '../Actions/ActionsContainer';

interface RiskAssessmentPhaseProps {
  client: Client;
}

const RiskAssessmentPhase = ({ client }: RiskAssessmentPhaseProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Risikovurderingsfase</CardTitle>
          <CardDescription>
            Vurdering av iboende risiko og kontrollrisiko før feltarbeid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            I denne fasen vurderes iboende risiko og kontrollrisiko før feltarbeidet starter.
          </p>
        </CardContent>
      </Card>
      
      <ActionsContainer clientId={client.id} phase="risk_assessment" />
    </div>
  );
};

export default RiskAssessmentPhase;