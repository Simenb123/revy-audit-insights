
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RevyAvatar from './RevyAvatar';

const AssistantSidebar = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <RevyAvatar size="sm" />
          AI-Revi Assistent
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Spør AI-Revi om hjelp med revisjon og regnskapsføring.
        </p>
      </CardContent>
    </Card>
  );
};

export default AssistantSidebar;
