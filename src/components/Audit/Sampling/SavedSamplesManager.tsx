import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SavedSamplesManagerProps {
  clientId: string;
  showReviewMode?: boolean;
}

const SavedSamplesManager: React.FC<SavedSamplesManagerProps> = ({ 
  clientId, 
  showReviewMode 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lagrede utvalg</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground">Kommer snart...</div>
      </CardContent>
    </Card>
  );
};

export default SavedSamplesManager;