import React from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '@/components/Layout/PageLayout';
import MultiAgentStudio from '@/components/AI/MultiAgentStudio/MultiAgentStudio';

const AIMultiAgentStudio: React.FC = () => {
  const { clientId } = useParams<{ clientId?: string }>();

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">AI Multi-Agent Studio</h1>
          <p className="text-muted-foreground">
            Organiser diskusjoner med spesialiserte AI-roller som moderator, advokat, revisor og flere.
          </p>
        </div>
        <MultiAgentStudio 
          clientId={clientId}
          documentContext={undefined}
        />
      </div>
    </PageLayout>
  );
};

export default AIMultiAgentStudio;