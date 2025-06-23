
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionsContainerProps {
  clientId: string;
}

const ActionsContainer: React.FC<ActionsContainerProps> = ({ clientId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Handlinger</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Revisjonshandlinger kommer her...</p>
      </CardContent>
    </Card>
  );
};

export default ActionsContainer;
