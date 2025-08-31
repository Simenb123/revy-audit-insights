import React from 'react';
import PageLayout from '@/components/Layout/PageLayout';
import EmbeddingsBatchProcessor from '@/components/AI/EmbeddingsBatchProcessor';

const AdminEmbeddingsManager: React.FC = () => {
  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Embeddings Manager</h1>
          <p className="text-muted-foreground">
            Administrer og generer embeddings for AI Revy's kunnskapsbase. 
            Embeddings er nødvendig for at AI skal kunne finne og bruke relevant informasjon.
          </p>
        </div>
        
        <EmbeddingsBatchProcessor />
      </div>
    </PageLayout>
  );
};

export default AdminEmbeddingsManager;