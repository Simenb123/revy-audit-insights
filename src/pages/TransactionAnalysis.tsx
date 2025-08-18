import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Eye, 
  Brain,
  Database,
  Filter,
  Download
} from 'lucide-react';

import { ComprehensiveAnalysisDashboard } from '@/components/TransactionAnalysis/ComprehensiveAnalysisDashboard';
import { ControlTestResults } from '@/components/TransactionAnalysis/ControlTestResults';
import { RiskScoringResults } from '@/components/TransactionAnalysis/RiskScoringResults';
import { TransactionFlowAnalysis } from '@/components/TransactionAnalysis/TransactionFlowAnalysis';
import { AIAnalysisResults } from '@/components/TransactionAnalysis/AIAnalysisResults';
import { ReportGeneratorPanel } from '@/components/TransactionAnalysis/ReportGeneratorPanel';
import { AnalysisConfigurationPanel } from '@/components/TransactionAnalysis/AnalysisConfigurationPanel';

import { useAvailableVersions } from '@/hooks/useAvailableVersions';
import { useAccountingData } from '@/hooks/useAccountingData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const TransactionAnalysis = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  // Data hooks
  const { data: versions, isLoading: versionsLoading } = useAvailableVersions(clientId || '');
  const { data: accountingData, isLoading: dataLoading } = useAccountingData(clientId || '');

  if (!clientId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ingen klient valgt</h2>
          <p className="text-muted-foreground">
            Velg en klient for å starte transaksjonsanalyse.
          </p>
        </div>
      </div>
    );
  }

  const handleVersionChange = (versionId: string) => {
    setSelectedVersion(versionId);
    toast.success('Dataversjon valgt for analyse');
  };

  const analysisModules = [
    {
      id: 'overview',
      title: 'Oversikt',
      description: 'Generell oversikt over transaksjonsdata',
      icon: BarChart3,
      component: ComprehensiveAnalysisDashboard
    },
    {
      id: 'controls',
      title: 'Kontroller',
      description: 'Automatiserte kontrollhandlinger',
      icon: Eye,
      component: ControlTestResults
    },
    {
      id: 'risk',
      title: 'Risikoscoring',
      description: 'AI-basert risikovurdering',
      icon: AlertTriangle,
      component: RiskScoringResults
    },
    {
      id: 'flow',
      title: 'Transaksjonsflyt',
      description: 'Visualisering av transaksjonsstrømmer',
      icon: TrendingUp,
      component: TransactionFlowAnalysis
    },
    {
      id: 'ai',
      title: 'AI-Analyse',
      description: 'Avansert AI-analyse av mønstre',
      icon: Brain,
      component: AIAnalysisResults
    },
    {
      id: 'reports',
      title: 'Rapporter',
      description: 'Generer detaljerte rapporter',
      icon: Download,
      component: ReportGeneratorPanel
    },
    {
      id: 'config',
      title: 'Konfigurasjon',
      description: 'Analyseinnstillinger og parametere',
      icon: Filter,
      component: AnalysisConfigurationPanel
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaksjonsanalyse</h1>
          <p className="text-muted-foreground">
            Avansert analyse av hovedboktransaksjoner og regnskapsdata
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-2">
            <Database className="h-3 w-3" />
            {accountingData?.generalLedgerTransactionsCount || 0} transaksjoner
          </Badge>
        </div>
      </div>

      {/* Version Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dataversjon</CardTitle>
          <CardDescription>
            Velg hvilken versjon av regnskapsdata som skal analyseres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-sm">
              <Select value={selectedVersion} onValueChange={handleVersionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg dataversjon..." />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map((version) => (
                    <SelectItem key={version.value} value={version.value}>
                      <div className="flex items-center gap-2">
                        <span>{version.label}</span>
                        {version.is_active && (
                          <Badge variant="default">Aktiv</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedVersion && (
              <Badge variant="outline" className="gap-2">
                <TrendingUp className="h-3 w-3" />
                Klar for analyse
              </Badge>
            )}
          </div>
          
          {!versionsLoading && (!versions || versions.length === 0) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Ingen data tilgjengelig</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Last opp hovedbokdata før du kan starte analysen.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Analysis Modules */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          {analysisModules.map((module) => (
            <TabsTrigger 
              key={module.id} 
              value={module.id}
              className="flex items-center gap-2 text-xs"
            >
              <module.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{module.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {analysisModules.map((module) => (
          <TabsContent key={module.id} value={module.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <module.icon className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedVersion ? (
                  <div>
                    {module.id === 'overview' && (
                      <ComprehensiveAnalysisDashboard 
                        clientId={clientId} 
                        dataVersionId={selectedVersion} 
                      />
                    )}
                    {module.id === 'controls' && (
                      <ControlTestResults results={[]} />
                    )}
                    {module.id === 'risk' && (
                      <RiskScoringResults results={null} />
                    )}
                    {module.id === 'flow' && (
                      <TransactionFlowAnalysis data={null} />
                    )}
                    {module.id === 'ai' && (
                      <AIAnalysisResults results={null} />
                    )}
                    {module.id === 'reports' && (
                      <ReportGeneratorPanel reportData={null} />
                    )}
                    {module.id === 'config' && (
                      <AnalysisConfigurationPanel 
                        onConfigurationChange={() => {}} 
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Velg dataversjon</h3>
                    <p className="text-muted-foreground">
                      Du må velge en dataversjon før du kan starte analysen.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TransactionAnalysis;