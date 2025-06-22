import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import DocumentReferenceViewer from './DocumentReferenceViewer';
import EnhancedDocumentUploader from './EnhancedDocumentUploader';
import { Upload, FileText, Filter, Search, BarChart3 } from 'lucide-react';

interface ImprovedClientDocumentManagerProps {
  clientId: string;
  clientName: string;
}

const ImprovedClientDocumentManager: React.FC<ImprovedClientDocumentManagerProps> = ({
  clientId,
  clientName
}) => {
  console.log('📁 [CLIENT_DOC_MANAGER] Props received:', { clientId, clientName });
  
  const { documents, isLoading, categories } = useClientDocuments(clientId);
  const [selectedTab, setSelectedTab] = useState('all');

  const filterDocuments = (category: string) => {
    if (category === 'all') return documents;
    if (category === 'no-text') return documents.filter(doc => 
      !doc.extracted_text || doc.text_extraction_status === 'failed'
    );
    if (category === 'processing') return documents.filter(doc => 
      doc.text_extraction_status === 'processing'
    );
    return documents.filter(doc => doc.category === category || doc.subject_area === category);
  };

  const filteredDocuments = filterDocuments(selectedTab);

  const stats = {
    total: documents.length,
    withText: documents.filter(doc => doc.extracted_text && doc.text_extraction_status === 'completed').length,
    processing: documents.filter(doc => doc.text_extraction_status === 'processing').length,
    failed: documents.filter(doc => doc.text_extraction_status === 'failed').length
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Laster dokumenter...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dokumenter</h2>
          <p className="text-sm text-gray-600">{clientName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Søk
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Totalt</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Med tekst</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.withText}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium">Prosesserer</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.processing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-red-500" />
              <span className="text-sm font-medium">Feilet</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="all">
            Alle ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="lønn">
            Lønn ({documents.filter(d => d.subject_area === 'lønn').length})
          </TabsTrigger>
          <TabsTrigger value="no-text">
            Ingen tekst ({stats.failed})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Prosesserer ({stats.processing})
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Last opp
          </TabsTrigger>
          <TabsTrigger value="insights">
            Innsikt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DocumentReferenceViewer 
            documents={filteredDocuments.map(doc => ({
              id: doc.id,
              fileName: doc.file_name,
              category: doc.category,
              summary: doc.ai_analysis_summary,
              confidence: doc.ai_confidence_score,
              textPreview: doc.extracted_text?.substring(0, 200),
              uploadDate: doc.created_at,
              relevantText: doc.extracted_text?.substring(0, 300)
            }))}
            title="Alle dokumenter"
            clientId={clientId}
          />
        </TabsContent>

        <TabsContent value="lønn">
          <DocumentReferenceViewer 
            documents={filteredDocuments.map(doc => ({
              id: doc.id,
              fileName: doc.file_name,
              category: doc.category,
              summary: doc.ai_analysis_summary,
              confidence: doc.ai_confidence_score,
              textPreview: doc.extracted_text?.substring(0, 200),
              uploadDate: doc.created_at,
              relevantText: doc.extracted_text?.substring(0, 300)
            }))}
            title="Lønn dokumenter"
            clientId={clientId}
          />
        </TabsContent>

        <TabsContent value="no-text">
          <DocumentReferenceViewer 
            documents={filteredDocuments.map(doc => ({
              id: doc.id,
              fileName: doc.file_name,
              category: doc.category,
              summary: doc.ai_analysis_summary,
              confidence: doc.ai_confidence_score,
              textPreview: doc.extracted_text?.substring(0, 200),
              uploadDate: doc.created_at,
              relevantText: doc.extracted_text?.substring(0, 300)
            }))}
            title="Dokumenter uten tekst"
            clientId={clientId}
          />
        </TabsContent>

        <TabsContent value="processing">
          <DocumentReferenceViewer 
            documents={filteredDocuments.map(doc => ({
              id: doc.id,
              fileName: doc.file_name,
              category: doc.category,
              summary: doc.ai_analysis_summary,
              confidence: doc.ai_confidence_score,
              textPreview: doc.extracted_text?.substring(0, 200),
              uploadDate: doc.created_at,
              relevantText: doc.extracted_text?.substring(0, 300)
            }))}
            title="Dokumenter som prosesseres"
            clientId={clientId}
          />
        </TabsContent>

        <TabsContent value="upload">
          <EnhancedDocumentUploader 
            clientId={clientId}
            onUploadComplete={() => {
              // Refresh will happen automatically via useClientDocuments
            }}
          />
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Dokumentinnsikt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Dokumentanalyse og innsikt kommer snart...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImprovedClientDocumentManager;
