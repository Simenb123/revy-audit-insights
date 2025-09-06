import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  FileSpreadsheet,
  Database,
  Settings,
  Info,
  TrendingUp,
  Calculator,
  Download,
  RefreshCw,
  Save
} from 'lucide-react';
import { RealTimeReconciliationDashboard } from './RealTimeReconciliationDashboard';
import { EnhancedReconciliationTable } from './EnhancedReconciliationTable';
import { EnhancedDragDropMappingInterface } from './EnhancedDragDropMappingInterface';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { PDFExport } from './PDFExport';
import { NotesManager } from './NotesManager';
import { PerformanceAnalysis } from './PerformanceAnalysis';
import { AccountMappingVisualizer } from './AccountMappingVisualizer';
import { DataQualityChecker } from './DataQualityChecker';
import { useReconciliationPersistence } from '@/hooks/useReconciliationPersistence';
import { generateMockMappings, generateDataQualityMetrics, generateDataQualityIssues } from '@/utils/mockDataGenerators';
import { toast } from '@/hooks/use-toast';

interface ReconciliationData {
  code: string;
  description: string;
  accounts: string[];
  accountNames: string[];
  accountDetails: Array<{ 
    account: string; 
    name: string; 
    amount: number; 
    source: 'TB' | 'A07' | 'Rule';
    matchedRule?: string;
  }>;
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  amelding: number;
  difference: number;
  dataSource: { A07: boolean; TB: boolean; Rules: number };
  debugSteps?: Array<{
    step: number;
    description: string;
    calculation?: string;
    value: number;
    accounts?: Array<{
      account: string;
      name: string;
      amount: number;
      operation: '+' | '-' | '=';
    }>;
    rules?: Array<{
      id: string;
      pattern: string;
      matched: boolean;
    }>;
    status: 'success' | 'warning' | 'error' | 'info';
  }>;
  notes?: string;
}

interface StreamlinedReconciliationViewProps {
  reconciliationData: ReconciliationData[];
  client?: any;
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  onUpdateNotes?: (code: string, notes: string) => void;
  onAcceptDiscrepancy?: (code: string) => void;
  onRejectDiscrepancy?: (code: string) => void;
}

const StreamlinedReconciliationView: React.FC<StreamlinedReconciliationViewProps> = ({
  reconciliationData,
  client,
  loading = false,
  onRefresh,
  onExport,
  onUpdateNotes,
  onAcceptDiscrepancy,
  onRejectDiscrepancy
}) => {
  const {
    loading: persistenceLoading,
    currentSessionId,
    saveReconciliationSession,
    saveNote,
    loadNotesForItem
  } = useReconciliationPersistence(client?.id || '');

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);
  const [notesCache, setNotesCache] = useState<Record<string, any[]>>({});

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalItems = reconciliationData.length;
    const perfectMatches = reconciliationData.filter(item => Math.abs(item.difference) <= 0.01).length;
    const smallDiscrepancies = reconciliationData.filter(item => 
      Math.abs(item.difference) > 0.01 && Math.abs(item.difference) <= 5
    ).length;
    const largeDiscrepancies = reconciliationData.filter(item => Math.abs(item.difference) > 5).length;
    const totalDiscrepancy = reconciliationData.reduce((sum, item) => sum + Math.abs(item.difference), 0);
    
    return {
      totalItems,
      perfectMatches,
      smallDiscrepancies,
      largeDiscrepancies,
      totalDiscrepancy
    };
  }, [reconciliationData]);

  // Filter data based on search and problem filter
  const filteredData = useMemo(() => {
    let filtered = reconciliationData;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.accountNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (showOnlyProblems) {
      filtered = filtered.filter(item => Math.abs(item.difference) > 0.01);
    }
    
    return filtered;
  }, [reconciliationData, searchTerm, showOnlyProblems]);

  const getStatusVariant = (difference: number) => {
    if (Math.abs(difference) <= 0.01) return 'success';
    if (Math.abs(difference) <= 5) return 'warning';
    return 'destructive';
  };

  const getStatusIcon = (difference: number) => {
    if (Math.abs(difference) <= 0.01) return CheckCircle;
    return AlertTriangle;
  };

  const getDataSourceBadge = (dataSource: ReconciliationData['dataSource']) => {
    const sources = [];
    if (dataSource.A07) sources.push({ label: 'A07', variant: 'default' as const });
    if (dataSource.TB) sources.push({ label: 'TB', variant: 'secondary' as const });
    if (dataSource.Rules > 0) sources.push({ label: `${dataSource.Rules} regler`, variant: 'outline' as const });
    return sources;
  };

  // Handle auto-save when reconciliation data changes
  const handleAutoSave = async () => {
    if (!reconciliationData || !client || persistenceLoading) return;
    
    const sessionId = await saveReconciliationSession(
      { items: reconciliationData },
      undefined, // payrollImportId - could be passed as prop if needed
      undefined  // trialBalanceId - could be passed as prop if needed
    );
    
    if (sessionId) {
      toast({
        title: "Avstemming auto-lagret",
        description: "Dataene er automatisk lagret i bakgrunnen."
      });
    }
  };

  // Enhanced notes handling
  const handleUpdateNotesEnhanced = async (code: string, notes: string) => {
    const success = await saveNote(code, 'Payroll Item', notes, 'note');
    if (success) {
      if (onUpdateNotes) onUpdateNotes(code, notes);
      // Refresh notes cache for this item
      const updatedNotes = await loadNotesForItem(code);
      setNotesCache(prev => ({
        ...prev,
        [code]: updatedNotes
      }));
    }
  };

  const handleAcceptDiscrepancyEnhanced = async (code: string) => {
    const success = await saveNote(code, 'Payroll Item', 'Discrepancy accepted by user', 'approval');
    if (success) {
      if (onAcceptDiscrepancy) onAcceptDiscrepancy(code);
    }
  };

  const handleRejectDiscrepancyEnhanced = async (code: string) => {
    const success = await saveNote(code, 'Payroll Item', 'Discrepancy rejected by user', 'rejection');
    if (success) {
      if (onRejectDiscrepancy) onRejectDiscrepancy(code);
    }
  };

  // Load notes for items when component mounts
  useEffect(() => {
    const loadAllNotes = async () => {
      if (!reconciliationData || reconciliationData.length === 0 || !currentSessionId) return;
      
      const notesPromises = reconciliationData.slice(0, 10).map(async (item: any) => {
        const notes = await loadNotesForItem(item.code);
        return { code: item.code, notes };
      });
      
      const results = await Promise.all(notesPromises);
      const notesMap = results.reduce((acc, { code, notes }) => {
        acc[code] = notes;
        return acc;
      }, {} as Record<string, any[]>);
      
      setNotesCache(notesMap);
    };

    loadAllNotes();
  }, [reconciliationData, currentSessionId, loadNotesForItem]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="enhanced">Interaktiv Avstemming</TabsTrigger>
            <TabsTrigger value="mapping">Kontomapping</TabsTrigger>
            <TabsTrigger value="quality">Datakvalitet</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <Button 
                onClick={handleAutoSave}
                disabled={persistenceLoading}
                variant="outline"
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                {persistenceLoading ? 'Lagrer...' : 'Lagre avstemming'}
              </Button>
              {currentSessionId && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Sesjon: {currentSessionId.substring(0, 8)}...
                </Badge>
              )}
            </div>

            {/* Real-time Dashboard */}
            <RealTimeReconciliationDashboard
              metrics={{
                totalItems: reconciliationData.length,
                perfectMatches: reconciliationData.filter(item => Math.abs(item.difference) <= 0.01).length,
                minorDiscrepancies: reconciliationData.filter(item => Math.abs(item.difference) > 0.01 && Math.abs(item.difference) <= 5).length,
                majorDiscrepancies: reconciliationData.filter(item => Math.abs(item.difference) > 5).length,
                totalDiscrepancyAmount: reconciliationData.reduce((sum, item) => sum + Math.abs(item.difference), 0),
                adjustedMatches: 0, // This would come from actual adjustments
                mappingCompleteness: 85, // This would be calculated from actual mapping data
                dataQualityScore: Math.max(0, 100 - (reconciliationData.filter(item => Math.abs(item.difference) > 1).length / Math.max(reconciliationData.length, 1)) * 100)
              }}
              targetAccuracy={95}
              showAnimation={true}
              onMetricClick={(metric) => {
                // Handle metric click - could filter data or navigate
                console.log('Metric clicked:', metric);
              }}
            />
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Kontrolloppstilling lønn</h2>
            <p className="text-muted-foreground">
              Avstemming mellom A07-melding og saldoliste
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
              Oppdater
            </Button>
              <PDFExport
                reconciliationData={{
                  items: reconciliationData.map(item => ({
                    description: item.description,
                    payrollAmount: item.amelding,
                    glAmount: item.D,
                    discrepancy: item.difference,
                    status: item.difference <= 0.01 ? 'match' : 
                            item.difference <= 5 ? 'minor_discrepancy' : 'major_discrepancy',
                    accounts: item.accountDetails.map(acc => ({ 
                      number: acc.account, 
                      name: acc.name 
                    }))
                  }))
                }}
                clientName={client?.name || "Klient"}
                orgNumber={client?.org_number}
                onExport={() => console.log('PDF exported')}
              />
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-1" />
              CSV Eksport
            </Button>
          </div>
        </div>

            {/* Performance Analysis */}
            <PerformanceAnalysis
              metrics={{
                totalItems: reconciliationData.length,
                perfectMatches: reconciliationData.filter(item => Math.abs(item.difference) <= 0.01).length,
                minorDiscrepancies: reconciliationData.filter(item => Math.abs(item.difference) > 0.01 && Math.abs(item.difference) <= 5).length,
                majorDiscrepancies: reconciliationData.filter(item => Math.abs(item.difference) > 5).length,
                totalDiscrepancyAmount: reconciliationData.reduce((sum, item) => sum + Math.abs(item.difference), 0),
                accountCoverage: (reconciliationData.filter(item => item.accountDetails.length > 0).length / Math.max(reconciliationData.length, 1)) * 100,
                dataQualityScore: Math.max(0, 100 - (reconciliationData.filter(item => Math.abs(item.difference) > 1).length / Math.max(reconciliationData.length, 1)) * 100)
              }}
              recommendations={[
                ...(reconciliationData.filter(item => Math.abs(item.difference) > 5).length > 0 ? 
                  [`Det er ${reconciliationData.filter(item => Math.abs(item.difference) > 5).length} store avvik som bør undersøkes nærmere.`] : []),
                ...(reconciliationData.filter(item => item.accountDetails.length === 0).length > 0 ? 
                  [`${reconciliationData.filter(item => item.accountDetails.length === 0).length} poster mangler kontomapping.`] : []),
                ...((reconciliationData.filter(item => Math.abs(item.difference) <= 0.01).length / Math.max(reconciliationData.length, 1)) < 0.9 ? 
                  ['Vurder å justere mappingreglene for å forbedre treffraten.'] : [])
              ]}
            />

            {/* Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Perfekte match</p>
                  <p className="text-2xl font-bold text-success">{summary.perfectMatches}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Små avvik</p>
                  <p className="text-2xl font-bold text-warning">{summary.smallDiscrepancies}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Store avvik</p>
                  <p className="text-2xl font-bold text-destructive">{summary.largeDiscrepancies}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Totalt avvik</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalDiscrepancy)}</p>
                </div>
                <Calculator className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter koder, beskrivelse eller kontonavn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showOnlyProblems ? "default" : "outline"}
            onClick={() => setShowOnlyProblems(!showOnlyProblems)}
            size="sm"
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Kun avvik
          </Button>
            </div>

            {/* Reconciliation Items */}
            <div className="space-y-4">
          {filteredData.map((item) => {
            const StatusIcon = getStatusIcon(item.difference);
            const statusVariant = getStatusVariant(item.difference);
            const sources = getDataSourceBadge(item.dataSource);

            return (
              <Card key={item.code} className={cn(
                "transition-colors",
                statusVariant === 'destructive' && "border-destructive/50",
                statusVariant === 'warning' && "border-warning/50",
                statusVariant === 'success' && "border-success/50"
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={cn(
                        "h-5 w-5",
                        statusVariant === 'success' && "text-success",
                        statusVariant === 'warning' && "text-warning",
                        statusVariant === 'destructive' && "text-destructive"
                      )} />
                      <div>
                        <CardTitle className="text-lg">{item.code}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sources.map((source, idx) => (
                        <Badge key={idx} variant={source.variant} className="text-xs">
                          {source.label}
                        </Badge>
                      ))}
                      {Math.abs(item.difference) > 0.01 && (
                        <Badge variant={statusVariant}>
                          Avvik: {formatCurrency(item.difference)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Simple calculation display */}
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-sm font-mono text-center">
                      <span className="text-muted-foreground">A:</span> {item.A.toLocaleString('no-NO')} + 
                      <span className="text-muted-foreground"> B:</span> {item.B.toLocaleString('no-NO')} - 
                      <span className="text-muted-foreground"> C:</span> {item.C.toLocaleString('no-NO')} = 
                      <span className="font-bold text-primary"> {item.D.toLocaleString('no-NO')}</span>
                      {item.difference !== 0 && (
                        <span className={cn(
                          " → Avvik: ",
                          statusVariant === 'success' && "text-success",
                          statusVariant === 'warning' && "text-warning",
                          statusVariant === 'destructive' && "text-destructive"
                        )}>
                          {formatCurrency(item.difference)}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Account details */}
                  {item.accountDetails.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Berørte kontoer ({item.accountDetails.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {item.accountDetails.slice(0, 6).map((detail, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-md p-2 text-xs">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono">{detail.account}</p>
                              <p className="text-muted-foreground truncate">{detail.name}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-mono">{detail.amount.toLocaleString('no-NO')}</p>
                              <Badge variant="outline" className="text-xs h-4">
                                {detail.source}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      {item.accountDetails.length > 6 && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          +{item.accountDetails.length - 6} flere kontoer
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions for discrepancies */}
                  {Math.abs(item.difference) > 0.01 && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <NotesManager
                          code={item.code}
                          description={item.description}
                          notes={notesCache[item.code] || []}
                          onUpdateNotes={handleUpdateNotesEnhanced}
                          onAcceptDiscrepancy={handleAcceptDiscrepancyEnhanced}
                          onRejectDiscrepancy={handleRejectDiscrepancyEnhanced}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => console.log('View debug details for', item.code)}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          Detaljer
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
            </div>

            {filteredData.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ingen data funnet</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || showOnlyProblems 
                      ? "Prøv å justere søkekriteriene dine"
                      : "Last inn A07-data og saldoliste for å starte avstemmingen"
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mapping">
            <EnhancedDragDropMappingInterface
              accounts={[]} // Would be populated from actual account data
              internalCodes={[]} // Would be populated from internal codes
              onUpdateMapping={(accountId, codeId) => {
                console.log('Update mapping:', accountId, codeId);
                // Handle mapping updates
              }}
              onBulkUpdate={(mappings) => {
                console.log('Bulk update:', mappings);
                // Handle bulk mapping updates
              }}
              searchTerm=""
              onSearchChange={(term) => {
                console.log('Search changed:', term);
                // Handle search changes
              }}
            />
          </TabsContent>

          <TabsContent value="quality">
            <DataQualityChecker 
              metrics={generateDataQualityMetrics({ items: reconciliationData })}
              issues={generateDataQualityIssues({ items: reconciliationData })}
              onFixIssue={(issueIndex) => {
                toast({
                  title: "Automatisk reparasjon",
                  description: "Problemløsning vil bli implementert senere."
                });
              }}
            />
          </TabsContent>

          {/* Enhanced Interactive Reconciliation Tab */}
          <TabsContent value="enhanced" className="space-y-6">
            <EnhancedReconciliationTable
              reconciliationData={reconciliationData}
              onUpdateNotes={handleUpdateNotesEnhanced}
              onAcceptDiscrepancy={handleAcceptDiscrepancyEnhanced}
              onRejectDiscrepancy={handleRejectDiscrepancyEnhanced}
              onManualAdjustment={(code, adjustment) => {
                console.log('Manual adjustment for', code, adjustment);
                // Handle manual adjustments - would update reconciliation data
              }}
            />
          </TabsContent>

          <TabsContent value="debug">
            <div className="p-6 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Debug-verktøy kommer snart. Detaljerte beregningsdata er tilgjengelig i konsollen.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="calculator">
            <div className="p-6 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Avansert kalkulator kommer snart. Bruk debug-fanen for detaljerte beregninger.
              </p>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default StreamlinedReconciliationView;