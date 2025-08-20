import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SampleResultsDisplay: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Utvalgsresultat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground">Kommer snart...</div>
      </CardContent>
    </Card>
  );
};

export default SampleResultsDisplay;