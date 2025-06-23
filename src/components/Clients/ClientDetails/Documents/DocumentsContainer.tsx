
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DocumentsContainerProps {
  clientId: string;
}

const DocumentsContainer: React.FC<DocumentsContainerProps> = ({ clientId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumenter</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Dokumentadministrasjon kommer her...</p>
      </CardContent>
    </Card>
  );
};

export default DocumentsContainer;
