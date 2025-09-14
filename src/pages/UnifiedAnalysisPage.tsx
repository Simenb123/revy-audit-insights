import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useClientLookup } from '@/hooks/useClientLookup';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Database, 
  Brain, 
  Target, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  Eye,
  Filter,
  Download,
  Play,
  Lightbulb
} from 'lucide-react';

// Import existing components
import AccountingExplorer from '@/components/DataAnalysis/AccountingExplorer';
import AuditSampling from '@/components/DataAnalysis/AuditSampling';
import ReportBuilder from '@/components/ReportBuilder/ReportBuilder';
import { RegnskapsDashboard } from '@/components/Accounting/RegnskapsDashboard';
import { AnalysisProvider } from '@/components/DataAnalysis/AnalysisProvider';
import { NorwegianCharFixer } from '@/components/Utils/NorwegianCharFixer';
import GeneralLedgerComparison from '@/components/Accounting/GeneralLedgerComparison';

// Transaction Analysis Components
import { ComprehensiveAnalysisDashboard } from '@/components/TransactionAnalysis/ComprehensiveAnalysisDashboard';
import { ControlTestResults } from '@/components/TransactionAnalysis/ControlTestResults';
import { RiskScoringResults } from '@/components/TransactionAnalysis/RiskScoringResults';
import { TransactionFlowAnalysis } from '@/components/TransactionAnalysis/TransactionFlowAnalysis';
import { AIAnalysisResults } from '@/components/TransactionAnalysis/AIAnalysisResults';
import { ReportGeneratorPanel } from '@/components/TransactionAnalysis/ReportGeneratorPanel';
import { AnalysisConfigurationPanel } from '@/components/TransactionAnalysis/AnalysisConfigurationPanel';

// AI Analysis Components
import RiskScoreCalculator from '@/components/AI/RiskScoreCalculator';
import PredictiveAnalytics from '@/components/AI/PredictiveAnalytics';
import IntelligentRecommendations from '@/components/AI/IntelligentRecommendations';
import RiskAssessment from '@/components/Dashboard/Widgets/RiskAssessment';

// Hooks
import { useAvailableVersions } from '@/hooks/useAvailableVersions';
import { useGeneralLedgerCount } from '@/hooks/useGeneralLedgerCount';
import { toast } from 'sonner';

const UnifiedAnalysisPage = React.memo(() => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: lookupResult, isLoading: lookupLoading } = useClientLookup(clientId);
  const actualClientId = lookupResult?.id || clientId;
  const { data: client, isLoading: clientLoading, error } = useClientDetails(actualClientId || '');
  const { setSelectedClientId } = useFiscalYear();
  
  // Transaction Analysis State
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [isAnalysisStarted, setIsAnalysisStarted] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState('overview');
  const [activeTransactionTab, setActiveTransactionTab] = useState('dashboard');
  const [activeAITab, setActiveAITab] = useState('overview');
  
  const isLoading = lookupLoading || clientLoading;

  // Data hooks for transaction analysis
  const { data: versions, isLoading: versionsLoading } = useAvailableVersions(clientId || '');
  const { data: transactionCount, isLoading: countLoading } = useGeneralLedgerCount(
    clientId || '', 
    selectedVersion || undefined
  );

  // Set the selected client ID when client data is loaded
  useEffect(() => {
    if (client?.id) {
      setSelectedClientId(client.id);
    }
  }, [client?.id, setSelectedClientId]);

  // Auto-select active version when versions load
  useEffect(() => {
    if (versions && versions.length > 0 && !selectedVersion) {
      const activeVersion = versions.find(v => v.is_active) || versions[versions.length - 1];
      setSelectedVersion(activeVersion.value);
    }
  }, [versions, selectedVersion]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Klient ikke funnet</h1>
          <p className="text-muted-foreground">
            Kunne ikke finne klient med ID {clientId}
          </p>
        </div>
      </div>
    );
  }

  const handleVersionChange = (versionId: string) => {
    setSelectedVersion(versionId);
    setIsAnalysisStarted(false);
    toast.success('Dataversjon valgt for analyse');
  };

  const handleStartAnalysis = async () => {
    if (!selectedVersion) {
      toast.error('Velg en dataversjon først');
      return;
    }
    
    setIsAnalysisStarted(true);
    toast.success('Analyse startet');
  };

  return (
    <StickyClientLayout
      clientName={client.company_name || client.name}
      orgNumber={client.org_number}
      pageTitle="Analyse"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Analyse Dashboard</h1>
                <p className="text-muted-foreground">
                  Omfattende analyse av regnskapsdata og AI-drevne innsikter
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-2">
                  <Database className="h-3 w-3" />
                  {selectedVersion ? (transactionCount || 0) : 0} transaksjoner
                </Badge>
              </div>
            </div>

            <AnalysisProvider clientId={client.id}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Oversikt
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Transaksjonsanalyse
                </TabsTrigger>
                <TabsTrigger value="ai-insights" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Innsikter
                </TabsTrigger>
                <TabsTrigger value="sampling" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Revisjonsutvalg
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Rapporter
                </TabsTrigger>
              </TabsList>
              
              {/* Overview Tab - Data Analysis */}
              <TabsContent value="overview" className="mt-6">
                <div className="space-y-6">
                  <AccountingExplorer clientId={client.id} />
                  <RegnskapsDashboard clientId={client.id} />
                </div>
              </TabsContent>
              
              {/* Transaction Analysis Tab */}
              <TabsContent value="transactions" className="mt-6">
                <div className="space-y-6">
                  {/* Version Selection Card */}
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
                        
                        <Button 
                          onClick={handleStartAnalysis}
                          disabled={!selectedVersion || versionsLoading}
                          className="gap-2"
                        >
                          <Play className="h-4 w-4" />
                          Analyser Data
                        </Button>
                        
                        {isAnalysisStarted && (
                          <Badge variant="default" className="gap-2">
                            <TrendingUp className="h-3 w-3" />
                            Analyse aktiv
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transaction Analysis Modules */}
                  {selectedVersion && isAnalysisStarted && (
                    <Tabs value={activeTransactionTab} onValueChange={setActiveTransactionTab}>
                      <TabsList className="grid w-full grid-cols-7">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="controls">Kontroller</TabsTrigger>
                        <TabsTrigger value="risk">Risiko</TabsTrigger>
                        <TabsTrigger value="flow">Flyt</TabsTrigger>
                        <TabsTrigger value="ai">AI</TabsTrigger>
                        <TabsTrigger value="tx-reports">Rapporter</TabsTrigger>
                        <TabsTrigger value="config">Konfig</TabsTrigger>
                      </TabsList>

                      <TabsContent value="dashboard" className="mt-6">
                        <ComprehensiveAnalysisDashboard 
                          clientId={clientId!} 
                          dataVersionId={selectedVersion} 
                        />
                      </TabsContent>

                      <TabsContent value="controls" className="mt-6">
                        <ControlTestResults results={[]} />
                      </TabsContent>

                      <TabsContent value="risk" className="mt-6">
                        <RiskScoringResults results={null} />
                      </TabsContent>

                      <TabsContent value="flow" className="mt-6">
                        <TransactionFlowAnalysis data={null} />
                      </TabsContent>

                      <TabsContent value="ai" className="mt-6">
                        <AIAnalysisResults clientId={clientId!} selectedVersion={selectedVersion} />
                      </TabsContent>

                      <TabsContent value="tx-reports" className="mt-6">
                        <ReportGeneratorPanel reportData={null} />
                      </TabsContent>

                      <TabsContent value="config" className="mt-6">
                        <AnalysisConfigurationPanel 
                          onConfigurationChange={() => {}} 
                        />
                      </TabsContent>
                    </Tabs>
                  )}

                  {!selectedVersion && !versionsLoading && (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Velg dataversjon</h3>
                        <p className="text-muted-foreground">
                          Du må velge en dataversjon før du kan starte transaksjonsanalysen.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              {/* AI Insights Tab */}
              <TabsContent value="ai-insights" className="mt-6">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">AI-Drevet Analyse</h2>
                      <p className="text-muted-foreground">
                        Avansert analyse og intelligente innsikter for {client.company_name}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Eksporter rapport
                    </Button>
                  </div>

                  <Tabs value={activeAITab} onValueChange={setActiveAITab}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Oversikt
                      </TabsTrigger>
                      <TabsTrigger value="risk" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Risikoscore
                      </TabsTrigger>
                      <TabsTrigger value="predictive" className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Prediktiv Analyse
                      </TabsTrigger>
                      <TabsTrigger value="recommendations" className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Anbefalinger
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RiskAssessment />
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Analyse-sammendrag</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <h4 className="font-medium text-blue-900 mb-2">AI Innsikter</h4>
                              <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Finansiell stabilitet vurderes som god</li>
                                <li>• Anbefaler økt fokus på kundefordringer</li>
                                <li>• Predikert vekst på 10% neste kvartal</li>
                                <li>• 5 aktive optimeringsforslag</li>
                              </ul>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 border rounded-lg">
                                <div className="text-2xl font-bold text-green-600">85</div>
                                <div className="text-xs text-muted-foreground">Risikoscore</div>
                              </div>
                              <div className="text-center p-3 border rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">92%</div>
                                <div className="text-xs text-muted-foreground">AI Confidence</div>
                              </div>
                            </div>

                            <Button className="w-full" onClick={() => setActiveAITab('risk')}>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Se detaljert risikoanalyse
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="risk" className="space-y-6">
                      <RiskScoreCalculator client={client} />
                    </TabsContent>

                    <TabsContent value="predictive" className="space-y-6">
                      <PredictiveAnalytics client={client} />
                    </TabsContent>

                    <TabsContent value="recommendations" className="space-y-6">
                      <IntelligentRecommendations client={client} />
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>
              
              {/* Audit Sampling Tab */}
              <TabsContent value="sampling" className="mt-6">
                <div className="space-y-6">
                  <GeneralLedgerComparison clientId={client.id} />
                  <AuditSampling clientId={client.id} />
                </div>
              </TabsContent>
              
              {/* Reports Tab */}
              <TabsContent value="reports" className="mt-6">
                <div className="space-y-6">
                  <ReportBuilder clientId={client.id} />
                  
                  {/* Utils Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Verktøy og Utilities
                      </CardTitle>
                      <CardDescription>
                        Hjelpeverktøy for databehandling og analyse
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <NorwegianCharFixer />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              </Tabs>
            </AnalysisProvider>
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
});

export default UnifiedAnalysisPage;