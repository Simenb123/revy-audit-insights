
import React, { useState } from 'react';
import AuditActionsManager from '@/components/AuditActions/AuditActionsManager';
import AIEnabledActionEditor from '@/components/AuditActions/AIEnabledActionEditor';
import IntelligentDocumentLinker from '@/components/ClientDocuments/IntelligentDocumentLinker';
import AuditActionsFlowTester from '@/components/AuditActions/AuditActionsFlowTester';
import SmartActionRecommendations from '@/components/AuditActions/SmartActionRecommendations';
import { AuditActionsProvider } from '@/contexts/AuditActionsContext';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  FileText, 
  Target, 
  Settings,
  TestTube2 
} from 'lucide-react';
import SeoHead from '@/components/SEO/SeoHead';

interface AuditActionsTabProps {
  clientId: string;
  phase?: string;
}

const AuditActionsTab = ({ clientId, phase }: AuditActionsTabProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AuditActionsProvider>
      <div className="space-y-6">
      <SeoHead title="Revisjonshandlinger – AI-verktøy og maler" description="Administrer revisjonshandlinger, AI-forslag, dokumentkobling og testing for klient." />
      <h1 className="sr-only">Revisjonshandlinger</h1>
      {/* Header med fase-info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Revisjonshandlinger
            {phase && (
              <Badge variant="secondary" className="ml-auto">
                Fase: {phase}
              </Badge>
            )}
          </CardTitle>
          <p className="text-muted-foreground">
            AI-drevet system for opprettelse, analyse og administrasjon av revisjonshandlinger
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <Target className="w-4 h-4" />
            Oversikt
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <Brain className="w-4 h-4" />
            AI-forslag
          </TabsTrigger>
          <TabsTrigger value="ai-tools" className="gap-2">
            <Settings className="w-4 h-4" />
            AI-verktøy
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            Dokumenter
          </TabsTrigger>
          <TabsTrigger value="testing" className="gap-2">
            <TestTube2 className="w-4 h-4" />
            Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-gray-900">Revisjonshandlinger</h2>
            <p className="text-gray-600 mt-2">
              Administrer revisjonshandlinger etter fagområde
            </p>
          </div>
          
          <AuditActionsManager clientId={clientId} phase={phase} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-gray-900">AI-drevne handlingsforslag</h2>
            <p className="text-gray-600 mt-2">
              Intelligente anbefalinger basert på risikovurdering og klientdata
            </p>
          </div>
          
          <SmartActionRecommendations clientId={clientId} phase={phase} />
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-gray-900">AI-drevne verktøy</h2>
            <p className="text-gray-600 mt-2">
              Bruk AI for å generere og forbedre revisjonshandlinger
            </p>
          </div>
          
          <AIEnabledActionEditor clientId={clientId} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-gray-900">Intelligent dokumentkobling</h2>
            <p className="text-gray-600 mt-2">
              AI-drevet analyse og kobling av dokumenter til revisjonshandlinger
            </p>
          </div>
          
          <IntelligentDocumentLinker clientId={clientId} />
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-gray-900">System testing og validering</h2>
            <p className="text-gray-600 mt-2">
              Test hele flyten og valider at alle komponenter fungerer sammen
            </p>
          </div>
          
          <AuditActionsFlowTester clientId={clientId} />
        </TabsContent>
      </Tabs>
      </div>
    </AuditActionsProvider>
  );
};

export default AuditActionsTab;
