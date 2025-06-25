
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, BarChart3, Brain } from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import DocumentUploader from './DocumentUploader';
import DocumentList from './DocumentList';
import EnhancedDocumentList from './EnhancedDocumentList';
import BulkTextExtraction from './BulkTextExtraction';
import DocumentCategories from './DocumentCategories';

interface ClientDocumentManagerProps {
  clientId: string;
  clientName?: string;
  enableAI?: boolean;
}

const ClientDocumentManager = ({ clientId, clientName, enableAI = false }: ClientDocumentManagerProps) => {
  const { documents, categories, isLoading, refetch } = useClientDocuments(clientId);
  const [activeTab, setActiveTab] = useState('documents');

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

  const getExtractionStats = () => {
    const total = documents.length;
    const completed = documents.filter(d => d.text_extraction_status === 'completed').length;
    const processing = documents.filter(d => d.text_extraction_status === 'processing').length;
    const failed = documents.filter(d => d.text_extraction_status === 'failed').length;
    const pending = total - completed - processing - failed;
    return { total, completed, processing, failed, pending };
  };

  const stats = getExtractionStats();

  const handleDocumentUpdate = () => {
    refetch();
  };

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

      {enableAI && documents.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-prosessering for {clientName || 'klient'}
              </h3>
              <div className="text-sm text-purple-700 space-y-1">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="font-medium text-green-700">{stats.completed}</span>
                    <span className="text-green-600"> AI kan lese</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">{stats.processing}</span>
                    <span className="text-blue-600"> prosesserer</span>
                  </div>
                  <div>
                    <span className="font-medium text-yellow-700">{stats.pending}</span>
                    <span className="text-yellow-600"> venter</span>
                  </div>
                  <div>
                    <span className="font-medium text-red-700">{stats.failed}</span>
                    <span className="text-red-600"> feilet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {enableAI && documents.length > 0 && (
        <BulkTextExtraction documents={documents} onUpdate={handleDocumentUpdate} />
      )}

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
          {enableAI ? (
            <EnhancedDocumentList
              documents={documents}
              isLoading={isLoading}
              clientId={clientId}
              onUpdate={handleDocumentUpdate}
            />
          ) : (
            <DocumentList
              documents={documents}
              documentsByCategory={documentsByCategory}
              isLoading={isLoading}
            />
          )}
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
