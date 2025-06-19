
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter,
  Brain,
  BarChart3,
  Settings,
  FolderOpen,
  Zap,
  MessageSquare,
  Lightbulb
} from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import DocumentUploader from './DocumentUploader';
import DocumentList from './DocumentList';
import SmartDocumentSearch from './SmartDocumentSearch';
import SmartCategoryPanel from './SmartCategoryPanel';
import BulkCategoryManager from './BulkCategoryManager';
import AdvancedDocumentWorkflow from './AdvancedDocumentWorkflow';
import EnhancedDocumentAnalyzer from './EnhancedDocumentAnalyzer';
import DocumentInsights from './DocumentInsights';

interface ImprovedClientDocumentManagerProps {
  clientId: string;
  clientName: string;
}

const ImprovedClientDocumentManager: React.FC<ImprovedClientDocumentManagerProps> = ({
  clientId,
  clientName
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { documents, isLoading, refetch, categories } = useClientDocuments(clientId);
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);

  // Create documentsByCategory as derived data
  const documentsByCategory = useMemo(() => {
    if (!documents) return {};
    
    return documents.reduce((acc, doc) => {
      const category = doc.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(doc);
      return acc;
    }, {} as Record<string, typeof documents>);
  }, [documents]);

  // Mock AI suggestions for SmartCategoryPanel
  const mockAISuggestions = [
    {
      category: 'Hovedbok',
      confidence: 0.9,
      reasoning: 'Dokumentet inneholder kontoplaner og posteringer',
      keywords: ['hovedbok', 'konto', 'postering']
    }
  ];

  const handleAcceptSuggestion = (category: string) => {
    console.log('Accepted suggestion:', category);
  };

  const handleRejectSuggestion = (category: string) => {
    console.log('Rejected suggestion:', category);
  };

  const handleCloseManager = () => {
    setSelectedDocuments([]);
  };

  const handleUpdateDocuments = () => {
    refetch();
    setSelectedDocuments([]);
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Oversikt',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <DocumentInsights 
            documents={documents || []}
            clientId={clientId}
            context="documentation"
          />
          <DocumentUploader 
            clientId={clientId}
            categories={categories || []}
          />
          <DocumentList 
            documents={documents || []}
            documentsByCategory={documentsByCategory || {}}
            isLoading={isLoading}
          />
        </div>
      )
    },
    {
      id: 'ai-insights',
      label: 'AI-Innsikt',
      icon: Brain,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Dokumentanalyse med AI-Revi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Bruk AI-Revi i høyre sidebar</span>
                </div>
                <p className="text-sm text-blue-700">
                  AI-Revi i sidebar vil automatisk tilpasse seg dokumentkonteksten når du er på denne siden. 
                  Åpne høyre sidebar for å få hjelp med dokumentanalyse og kategorisering.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium">Totalt dokumenter</p>
                  <p className="text-lg font-bold text-blue-600">{documents?.length || 0}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium">Kategoriserte</p>
                  <p className="text-lg font-bold text-green-600">{documents?.filter(d => d.category).length || 0}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium">Trenger gjennomgang</p>
                  <p className="text-lg font-bold text-yellow-600">{documents?.filter(d => !d.category).length || 0}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium">AI-sikkerhet</p>
                  <p className="text-lg font-bold text-purple-600">
                    {documents?.length ? Math.round((documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.8).length / documents.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <DocumentInsights 
            documents={documents || []}
            clientId={clientId}
            context="documentation"
          />
        </div>
      )
    },
    {
      id: 'enhanced-analysis',
      label: 'AI-Analyse',
      icon: Brain,
      content: (
        <EnhancedDocumentAnalyzer 
          clientId={clientId}
        />
      )
    },
    {
      id: 'search',
      label: 'Smart Søk',
      icon: Search,
      content: (
        <SmartDocumentSearch clientId={clientId} />
      )
    },
    {
      id: 'categories',
      label: 'Kategorier',
      icon: Filter,
      content: (
        <SmartCategoryPanel 
          suggestions={mockAISuggestions}
          onAccept={handleAcceptSuggestion}
          onReject={handleRejectSuggestion}
          isVisible={true}
        />
      )
    },
    {
      id: 'bulk-edit',
      label: 'Bulk Endring',
      icon: FolderOpen,
      content: selectedDocuments.length > 0 ? (
        <BulkCategoryManager 
          selectedDocuments={selectedDocuments}
          categories={categories || []}
          onClose={handleCloseManager}
          onUpdate={handleUpdateDocuments}
        />
      ) : (
        <div className="text-center text-muted-foreground p-8">
          Velg dokumenter fra oversikten for å bruke bulk-endring
        </div>
      )
    },
    {
      id: 'workflows',
      label: 'Arbeidsflyt',
      icon: Zap,
      content: (
        <AdvancedDocumentWorkflow clientId={clientId} />
      )
    },
    {
      id: 'reports',
      label: 'Rapporter',
      icon: BarChart3,
      content: (
        <div>Kommer snart...</div>
      )
    },
    {
      id: 'settings',
      label: 'Innstillinger',
      icon: Settings,
      content: (
        <div>Kommer snart...</div>
      )
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Dokumenter for {clientName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Administrer og organiser klientdokumenter med AI-Revi assistanse i høyre sidebar
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-1 text-xs">
                <tab.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImprovedClientDocumentManager;
