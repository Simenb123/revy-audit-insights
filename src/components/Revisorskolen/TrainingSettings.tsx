import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { isAdvancedAIEnabled } from '@/lib/featureFlags';

const TrainingSettings = () => {
  // Don't render if feature is disabled
  if (!isAdvancedAIEnabled()) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Trenings Innstillinger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Treningsinnstillinger kommer snart.
        </p>
      </CardContent>
    </Card>
  );
};

export default TrainingSettings;