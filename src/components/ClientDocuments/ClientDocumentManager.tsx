
import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, BarChart3, Brain, Search, Workflow } from 'lucide-react';
import { TestAIPipelineButton } from '../documents/TestAIPipelineButton';
import { useClientDocumentsList } from '@/hooks/useClientDocumentsList';
import { useDocumentCategories } from '@/hooks/useDocumentCategories';
import { useDocumentOperations } from '@/hooks/useDocumentOperations';
import DocumentUploader from './DocumentUploader';
import DocumentList from './DocumentList';
import EnhancedDocumentList from './EnhancedDocumentList';
import BulkTextExtraction from './BulkTextExtraction';
import DocumentCategories from './DocumentCategories';
import { DocumentExtractionFixer } from './DocumentExtractionFixer';
import { DocumentAIPipelineManager } from './DocumentAIPipelineManager';
import SmartDocumentOverview from '@/components/Revy/SmartDocumentOverview';
import AdvancedDocumentSearch from './AdvancedDocumentSearch';
import DocumentAnalyticsDashboard from './DocumentAnalyticsDashboard';
import DocumentWorkflowManager from './DocumentWorkflowManager';
import { DocumentVersionControl } from './DocumentVersionControl';
import { DocumentApprovalWorkflow } from './DocumentApprovalWorkflow';
import { DocumentComplianceTracker } from './DocumentComplianceTracker';
import { DocumentGuidanceCard } from '../Revy/DocumentGuidanceCard';

interface ClientDocumentManagerProps {
  clientId: string;
  clientName?: string;
  enableAI?: boolean;
}

const ClientDocumentManager = ({ clientId, clientName, enableAI = false }: ClientDocumentManagerProps) => {
  const queryClient = useQueryClient();
  
  // Direct data fetching with client ID - no lookup needed
  const documentsQuery = useClientDocumentsList(clientId);
  const categoriesQuery = useDocumentCategories();
  const documentOperations = useDocumentOperations(clientId);
  
  const documents = documentsQuery.data || [];
  const categories = categoriesQuery.data || [];
  const isLoading = documentsQuery.isLoading || categoriesQuery.isLoading;

  // Force cache clear and refetch when clientId changes to prevent showing cached documents from other clients
  React.useEffect(() => {
    if (clientId) {
      // Invalidate specific client-documents query with exact key match
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
      // Also invalidate all client-documents queries to be safe
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      // Force refetch for this specific client
      documentsQuery.refetch();
    }
  }, [clientId, queryClient, documentsQuery.refetch]);

  // Synchronize filteredDocuments with documents when documents data changes
  React.useEffect(() => {
    setFilteredDocuments(documents);
  }, [documents]);
  
  const [activeTab, setActiveTab] = useState('documents');
  const [filteredDocuments, setFilteredDocuments] = useState(documents);
  
  // Debug logging (temporary)
  console.log('ClientDocumentManager Debug:', {
    clientId,
    documentsCount: documents.length,
    firstDocumentClientId: documents[0]?.client_id,
    isLoading
  });

  const handleSearchResults = useCallback((results: typeof documents) => {
    setFilteredDocuments(results);
  }, []);

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
    documentsQuery.refetch();
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
        <DocumentGuidanceCard 
          documentCount={documents.length}
          readableDocuments={stats.completed}
          className="mb-4"
        />
      )}

      {enableAI && documents.length > 0 && (
        <BulkTextExtraction documents={documents} onUpdate={handleDocumentUpdate} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${enableAI ? 'grid-cols-9' : 'grid-cols-3'}`}>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Last opp
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dokumenter ({documents.length})
          </TabsTrigger>
          {enableAI && (
            <>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Søk
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analyse
              </TabsTrigger>
              <TabsTrigger value="workflow" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Arbeidsflyt
              </TabsTrigger>
              <TabsTrigger value="ai-overview" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI-Chat
              </TabsTrigger>
              <TabsTrigger value="versions" className="flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                Versjoner
              </TabsTrigger>
              <TabsTrigger value="approval" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Godkjenning
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Compliance
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Kategorier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <DocumentUploader clientId={clientId} categories={categories} />
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-4">
            <DocumentExtractionFixer onUpdate={handleDocumentUpdate} />
            <DocumentAIPipelineManager onUpdate={handleDocumentUpdate} />
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
                clientId={clientId}
              />
            )}
          </div>
        </TabsContent>

        {enableAI && (
          <>
            <TabsContent value="search">
              <AdvancedDocumentSearch
                documents={documents}
                onSearchResults={handleSearchResults}
                categories={categories.map(c => c.category_name)}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <DocumentAnalyticsDashboard
                documents={documents}
                clientName={clientName}
              />
            </TabsContent>

            <TabsContent value="workflow">
              <DocumentWorkflowManager
                documents={documents}
                clientId={clientId}
                onUpdate={handleDocumentUpdate}
              />
            </TabsContent>

            <TabsContent value="ai-overview">
              <SmartDocumentOverview 
                client={{ id: clientId, company_name: clientName } as any}
                documents={documents}
              />
            </TabsContent>

            <TabsContent value="versions">
              <DocumentVersionControl 
                documents={documents} 
                className="mt-6" 
              />
            </TabsContent>

            <TabsContent value="approval">
              <DocumentApprovalWorkflow 
                documents={documents} 
                className="mt-6" 
              />
            </TabsContent>

            <TabsContent value="compliance">
              <DocumentComplianceTracker 
                documents={documents} 
                className="mt-6" 
              />
            </TabsContent>
          </>
        )}

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
