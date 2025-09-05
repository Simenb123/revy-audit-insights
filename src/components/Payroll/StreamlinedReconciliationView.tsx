import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReconciliationData {
  code: string;
  description: string;
  accounts: string[];
  accountNames: string[];
  accountDetails: Array<{ 
    account: string; 
    name: string; 
    amount: number; 
    source: 'TB' | 'A07' | 'Rule' 
  }>;
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  amelding: number;
  difference: number;
  dataSource: { A07: boolean; TB: boolean; Rules: number };
  notes?: string;
}

interface StreamlinedReconciliationViewProps {
  reconciliationData: ReconciliationData[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  onUpdateNotes?: (code: string, notes: string) => void;
  onAcceptDiscrepancy?: (code: string) => void;
  onRejectDiscrepancy?: (code: string) => void;
}

const StreamlinedReconciliationView: React.FC<StreamlinedReconciliationViewProps> = ({
  reconciliationData,
  isLoading = false,
  onRefresh,
  onExport,
  onUpdateNotes,
  onAcceptDiscrepancy,
  onRejectDiscrepancy
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);

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

  return (
    <TooltipProvider>
      <div className="space-y-6">
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
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
              Oppdater
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-1" />
              Eksporter
            </Button>
          </div>
        </div>

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
                  <p className="text-2xl font-bold">{summary.totalDiscrepancy.toLocaleString('no-NO', { minimumFractionDigits: 2 })} kr</p>
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
                        <Tooltip key={idx}>
                          <TooltipTrigger>
                            <Badge variant={source.variant} className="text-xs">
                              {source.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Data fra: {source.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {Math.abs(item.difference) > 0.01 && (
                        <Badge variant={statusVariant}>
                          Avvik: {item.difference.toLocaleString('no-NO', { minimumFractionDigits: 2 })} kr
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Calculation breakdown */}
                  <div className="grid grid-cols-6 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground">A (A07)</p>
                      <p className="font-mono">{item.A.toLocaleString('no-NO')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">B (Forr.år)</p>
                      <p className="font-mono">{item.B.toLocaleString('no-NO')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">C (Inneværende)</p>
                      <p className="font-mono">{item.C.toLocaleString('no-NO')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">D (Beregnet)</p>
                      <p className="font-mono font-bold">{item.D.toLocaleString('no-NO')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">E (Å melde)</p>
                      <p className="font-mono">{item.E.toLocaleString('no-NO')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Avvik</p>
                      <p className={cn(
                        "font-mono font-bold",
                        statusVariant === 'success' && "text-success",
                        statusVariant === 'warning' && "text-warning",
                        statusVariant === 'destructive' && "text-destructive"
                      )}>
                        {item.difference.toLocaleString('no-NO', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Account details */}
                  {item.accountDetails.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Berørte kontoer ({item.accountDetails.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {item.accountDetails.map((detail, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-md p-2 text-xs">
                            <div>
                              <p className="font-mono">{detail.account}</p>
                              <p className="text-muted-foreground truncate max-w-32">{detail.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono">{detail.amount.toLocaleString('no-NO')}</p>
                              <Badge variant="outline" className="text-xs">
                                {detail.source}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions for discrepancies */}
                  {Math.abs(item.difference) > 0.01 && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAcceptDiscrepancy?.(item.code)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Godkjenn avvik
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRejectDiscrepancy?.(item.code)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Juster mapping
                      </Button>
                    </div>
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
      </div>
    </TooltipProvider>
  );
};

export default StreamlinedReconciliationView;