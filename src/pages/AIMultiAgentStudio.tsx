import React from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '@/components/Layout/PageLayout';
import EnhancedMultiAgentStudio from '@/components/AI/MultiAgentStudio/EnhancedMultiAgentStudio';

const AIMultiAgentStudio: React.FC = () => {
  const { clientId } = useParams<{ clientId?: string }>();

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">AI Multi-Agent Studio</h1>
          <p className="text-muted-foreground">
            Intelligent agent-samarbeid med avansert kontekstanalyse og samtalestyring.
          </p>
        </div>
        <EnhancedMultiAgentStudio 
          clientId={clientId}
          documentContext={undefined}
          context="general"
        />
      </div>
    </PageLayout>
  );
};

export default AIMultiAgentStudio;