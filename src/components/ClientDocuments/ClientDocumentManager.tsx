
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, BarChart3 } from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import DocumentUploader from './DocumentUploader';
import DocumentList from './DocumentList';
import DocumentCategories from './DocumentCategories';

interface ClientDocumentManagerProps {
  clientId: string;
  clientName: string;
}

const ClientDocumentManager = ({ clientId, clientName }: ClientDocumentManagerProps) => {
  const { documents, categories, isLoading } = useClientDocuments(clientId);
  const [activeTab, setActiveTab] = useState('upload');

  // Fix: Group documents by category properly
  const documentsByCategory: Record<string, typeof documents> = {};
  documents.forEach(doc => {
    const category = doc.category || 'Ukategorisert';
    if (!documentsByCategory[category]) {
      documentsByCategory[category] = [];
    }
    documentsByCategory[category].push(doc);
  });

  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    documentCount: documents.filter(doc => doc.category === cat.category_name).length
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Dokumenter for {clientName}</h2>
          <p className="text-muted-foreground">
            Last opp og organiser revisjonsrelaterte dokumenter
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Last opp
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dokumenter ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Kategorier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <DocumentUploader clientId={clientId} categories={categories} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentList 
            documents={documents} 
            documentsByCategory={documentsByCategory}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="categories">
          <DocumentCategories 
            categories={categoriesWithCounts}
            documents={documents}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDocumentManager;
