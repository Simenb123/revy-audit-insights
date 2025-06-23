
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Brain } from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import DocumentUploader from './DocumentUploader';
import EnhancedDocumentList from './EnhancedDocumentList';
import BulkTextExtraction from './BulkTextExtraction';

interface ImprovedClientDocumentManagerProps {
  clientId: string;
  clientName?: string;
}

const ImprovedClientDocumentManager: React.FC<ImprovedClientDocumentManagerProps> = ({
  clientId,
  clientName
}) => {
  const { documents, categories, isLoading, refetch } = useClientDocuments(clientId);

  console.log('📋 [CLIENT_DOC_MANAGER] Rendered with:', {
    clientId,
    documentsCount: documents.length,
    isLoading,
    documents: documents.map(d => ({
      id: d.id,
      fileName: d.file_name,
      status: d.text_extraction_status,
      hasText: !!d.extracted_text
    }))
  });

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
    console.log('📋 [CLIENT_DOC_MANAGER] Refreshing documents after update');
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* AI Status Overview */}
      {documents.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                🚀 Frontend AI-Prosessering for {clientName || 'klient'}
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

      {/* Bulk Processing - This should now be visible */}
      {documents.length > 0 && (
        <BulkTextExtraction 
          documents={documents}
          onUpdate={handleDocumentUpdate}
        />
      )}

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dokumenter ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Last opp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <EnhancedDocumentList 
            documents={documents}
            isLoading={isLoading}
            clientId={clientId}
            onUpdate={handleDocumentUpdate}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <DocumentUploader 
            clientId={clientId}
            categories={categories}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImprovedClientDocumentManager;
