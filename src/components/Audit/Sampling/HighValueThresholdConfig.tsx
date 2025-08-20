import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const HighValueThresholdConfig: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Høyverdi-terskel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground">Kommer snart...</div>
      </CardContent>
    </Card>
  );
};

export default HighValueThresholdConfig;