
import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import DocumentUploader from './DocumentUploader';
import DocumentList from './DocumentList';
import SmartDocumentSearch from './SmartDocumentSearch';
import SmartCategoryPanel from './SmartCategoryPanel';
import BulkCategoryManager from './BulkCategoryManager';
import AdvancedDocumentWorkflow from './AdvancedDocumentWorkflow';
import EnhancedDocumentAnalyzer from './EnhancedDocumentAnalyzer';

interface ImprovedClientDocumentManagerProps {
  clientId: string;
  clientName: string;
}

const ImprovedClientDocumentManager: React.FC<ImprovedClientDocumentManagerProps> = ({
  clientId,
  clientName
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { documents, isLoading, refetch, categories, documentsByCategory } = useClientDocuments(clientId);
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);

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
        <CardTitle>Dokumenter for {clientName}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Administrer og organiser klientdokumenter
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
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
