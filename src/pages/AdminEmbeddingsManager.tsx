import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, FileText, Scale, Upload } from 'lucide-react';
import EmbeddingsBatchProcessor from '@/components/AI/EmbeddingsBatchProcessor';
import LegalDocumentsUploader from '@/components/AI/LegalDocumentsUploader';
import PageLayout from '@/components/Layout/PageLayout';

const AdminEmbeddingsManager: React.FC = () => {
  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">AI Embeddings & Juridisk Innhold</h1>
          <p className="text-muted-foreground">
            Administrer embeddings og last opp juridisk innhold for AI Revy's kunnskapsbase. 
            Embeddings er nødvendig for at AI skal kunne finne og bruke relevant informasjon.
          </p>
        </div>
        
        <Tabs defaultValue="embeddings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="embeddings" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Embeddings behandling
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Last opp juridisk innhold
            </TabsTrigger>
          </TabsList>

          <TabsContent value="embeddings">
            <EmbeddingsBatchProcessor />
          </TabsContent>
          
          <TabsContent value="upload">
            <LegalDocumentsUploader />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default AdminEmbeddingsManager;