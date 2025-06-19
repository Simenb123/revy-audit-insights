import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, BarChart3, Bot } from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import EnhancedDocumentUploader from './EnhancedDocumentUploader';
import EnhancedDocumentList from './EnhancedDocumentList';
import DocumentCategories from './DocumentCategories';
import DocumentDeleteDebugger from './DocumentDeleteDebugger';

interface ImprovedClientDocumentManagerProps {
  clientId: string;
  clientName: string;
}

const ImprovedClientDocumentManager = ({ clientId, clientName }: ImprovedClientDocumentManagerProps) => {
  const { documents, categories, isLoading } = useClientDocuments(clientId);
  const [activeTab, setActiveTab] = useState('upload');

  // Log AI categorization for debugging
  React.useEffect(() => {
    console.log('=== AI CATEGORIZATION DEBUG ===');
    console.log('Total documents:', documents.length);
    
    documents.forEach(doc => {
      console.log(`Document: ${doc.file_name}`);
      console.log(`- Subject area: ${doc.subject_area || 'None'}`);
      console.log(`- Category: ${doc.category || 'None'}`);
      console.log(`- AI suggested: ${doc.ai_suggested_category || 'None'}`);
      console.log(`- AI confidence: ${doc.ai_confidence_score || 'None'}`);
      console.log(`- AI analysis: ${doc.ai_analysis_summary || 'None'}`);
      console.log('---');
    });
  }, [documents]);

  const documentsByCategory = documents.reduce((acc, doc) => {
    const category = doc.category || 'Ukategorisert';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    documentCount: documents.filter(doc => doc.category === cat.category_name).length
  }));

  // AI-kategorisering statistikk
  const aiStats = {
    highConfidence: documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.8).length,
    mediumConfidence: documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.6 && d.ai_confidence_score < 0.8).length,
    lowConfidence: documents.filter(d => d.ai_confidence_score && d.ai_confidence_score < 0.6).length,
    uncategorized: documents.filter(d => !d.ai_confidence_score).length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Forbedret dokumenthåndtering for {clientName}</h2>
          <p className="text-muted-foreground">
            Last opp og organiser dokumenter med forbedret AI-kategorisering
          </p>
        </div>
      </div>

      {/* Debug informasjon */}
      <DocumentDeleteDebugger clientId={clientId} />

      {/* AI-statistikk banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">AI-kategorisering status</h3>
                <p className="text-sm text-blue-700">
                  {documents.length} dokumenter • {aiStats.highConfidence} høy sikkerhet • {aiStats.uncategorized} ukategoriserte
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">{aiStats.highConfidence}</div>
                <div className="text-xs text-green-700">Høy sikkerhet</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">{aiStats.mediumConfidence}</div>
                <div className="text-xs text-yellow-700">Middels sikkerhet</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{aiStats.lowConfidence}</div>
                <div className="text-xs text-red-700">Lav sikkerhet</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-600">{aiStats.uncategorized}</div>
                <div className="text-xs text-gray-700">Ukategoriserte</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Last opp (forbedret AI)
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
          <EnhancedDocumentUploader clientId={clientId} categories={categories} />
        </TabsContent>

        <TabsContent value="documents">
          <EnhancedDocumentList 
            documents={documents} 
            documentsByCategory={documentsByCategory}
            isLoading={isLoading}
            categories={categories}
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

export default ImprovedClientDocumentManager;
