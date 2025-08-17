import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  TrendingDown, 
  TrendingUp,
  Calculator,
  FileText,
  ArrowRight
} from 'lucide-react';
import { useIntelligentCache } from '@/hooks/useIntelligentCache';
import { EnhancedDataTable } from '@/components/ui/enhanced-data-table';

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'balance' | 'consistency' | 'completeness' | 'logic';
  execute: (data: any[]) => ValidationResult[];
}

interface ValidationResult {
  ruleId: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: string;
  affectedRecords?: number;
  suggestedAction?: string;
  relatedAccounts?: string[];
}

interface CrossCheckWidgetProps {
  data: any[];
  dataSourceId: string;
  title?: string;
  enabledRules?: string[];
  showSummary?: boolean;
  autoRefresh?: boolean;
}

// Predefined validation rules
const validationRules: ValidationRule[] = [
  {
    id: 'balance-check',
    name: 'Balansekontroll',
    description: 'Kontrollerer at debet = kredit for alle transaksjoner',
    severity: 'error',
    category: 'balance',
    execute: (data) => {
      const totalDebet = data.reduce((sum, record) => sum + (record.debet || 0), 0);
      const totalKredit = data.reduce((sum, record) => sum + (record.kredit || 0), 0);
      const difference = Math.abs(totalDebet - totalKredit);
      
      return [{
        ruleId: 'balance-check',
        status: difference < 0.01 ? 'passed' : 'failed',
        message: difference < 0.01 
          ? 'Balanse OK - Debet = Kredit' 
          : `Balansefeil: Differanse på ${difference.toFixed(2)}`,
        details: `Total debet: ${totalDebet.toFixed(2)}, Total kredit: ${totalKredit.toFixed(2)}`,
        affectedRecords: difference > 0.01 ? data.length : 0,
        suggestedAction: difference > 0.01 ? 'Kontroller alle posteringer for feil i beløp' : undefined
      }];
    }
  },
  {
    id: 'duplicate-check',
    name: 'Duplikatkontroll',
    description: 'Finner potensielle duplikattransaksjoner',
    severity: 'warning',
    category: 'consistency',
    execute: (data) => {
      const seen = new Set();
      const duplicates: any[] = [];
      
      data.forEach(record => {
        const key = `${record.dato}-${record.belop}-${record.kontonr}`;
        if (seen.has(key)) {
          duplicates.push(record);
        } else {
          seen.add(key);
        }
      });
      
      return [{
        ruleId: 'duplicate-check',
        status: duplicates.length === 0 ? 'passed' : 'warning',
        message: duplicates.length === 0 
          ? 'Ingen duplikater funnet' 
          : `${duplicates.length} potensielle duplikater funnet`,
        affectedRecords: duplicates.length,
        suggestedAction: duplicates.length > 0 ? 'Gjennomgå duplikater manuelt' : undefined
      }];
    }
  },
  {
    id: 'missing-accounts',
    name: 'Manglende kontoer',
    description: 'Kontrollerer at alle kontonummer er gyldige',
    severity: 'error',
    category: 'completeness',
    execute: (data) => {
      const invalidAccounts = data.filter(record => 
        !record.kontonr || record.kontonr === '' || record.kontonr.toString().length < 4
      );
      
      return [{
        ruleId: 'missing-accounts',
        status: invalidAccounts.length === 0 ? 'passed' : 'failed',
        message: invalidAccounts.length === 0 
          ? 'Alle kontonummer er gyldige' 
          : `${invalidAccounts.length} poster med ugyldige kontonummer`,
        affectedRecords: invalidAccounts.length,
        suggestedAction: invalidAccounts.length > 0 ? 'Rett opp manglende kontonummer' : undefined
      }];
    }
  },
  {
    id: 'date-sequence',
    name: 'Datosekvens',
    description: 'Kontrollerer at datoer er i logisk rekkefølge',
    severity: 'warning',
    category: 'logic',
    execute: (data) => {
      const sortedData = [...data].sort((a, b) => new Date(a.dato).getTime() - new Date(b.dato).getTime());
      const outOfSequence = data.filter((record, index) => {
        const sortedIndex = sortedData.findIndex(r => r === record);
        return Math.abs(sortedIndex - index) > 5; // Allow some flexibility
      });
      
      return [{
        ruleId: 'date-sequence',
        status: outOfSequence.length === 0 ? 'passed' : 'warning',
        message: outOfSequence.length === 0 
          ? 'Datoer er i logisk rekkefølge' 
          : `${outOfSequence.length} poster kan være feil datert`,
        affectedRecords: outOfSequence.length,
        suggestedAction: outOfSequence.length > 0 ? 'Kontroller datorekkefølge' : undefined
      }];
    }
  }
];

export const CrossCheckWidget: React.FC<CrossCheckWidgetProps> = ({
  data,
  dataSourceId,
  title = 'CrossCheck Validering',
  enabledRules = validationRules.map(r => r.id),
  showSummary = true,
  autoRefresh = true
}) => {
  const [selectedTab, setSelectedTab] = useState('summary');
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);

  // Use intelligent cache for validation results
  const { data: cachedResults, refetch } = useIntelligentCache(
    `crosscheck-${dataSourceId}`,
    async () => {
      const results: ValidationResult[] = [];
      const activeRules = validationRules.filter(rule => enabledRules.includes(rule.id));
      
      activeRules.forEach(rule => {
        try {
          const ruleResults = rule.execute(data);
          results.push(...ruleResults);
        } catch (error) {
          console.error(`Error executing rule ${rule.id}:`, error);
          results.push({
            ruleId: rule.id,
            status: 'failed',
            message: `Regel kunne ikke kjøres: ${error}`,
            suggestedAction: 'Kontroller dataformat'
          });
        }
      });
      
      return results;
    },
    {
      enabled: data.length > 0,
      staleTime: 30000, // 30 seconds
      refetchOnMount: autoRefresh
    }
  );

  useEffect(() => {
    if (cachedResults) {
      setValidationResults(cachedResults);
    }
  }, [cachedResults]);

  // Summary statistics
  const summary = useMemo(() => {
    const passed = validationResults.filter(r => r.status === 'passed').length;
    const failed = validationResults.filter(r => r.status === 'failed').length;
    const warnings = validationResults.filter(r => r.status === 'warning').length;
    const totalAffected = validationResults.reduce((sum, r) => sum + (r.affectedRecords || 0), 0);
    
    return { passed, failed, warnings, totalAffected, total: validationResults.length };
  }, [validationResults]);

  // Group results by category
  const resultsByCategory = useMemo(() => {
    const categories: Record<string, ValidationResult[]> = {};
    validationResults.forEach(result => {
      const rule = validationRules.find(r => r.id === result.ruleId);
      const category = rule?.category || 'other';
      if (!categories[category]) categories[category] = [];
      categories[category].push(result);
    });
    return categories;
  }, [validationResults]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'passed':
        return 'success' as const;
      case 'failed':
        return 'destructive' as const;
      case 'warning':
        return 'warning' as const;
      default:
        return 'secondary' as const;
    }
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>
            Automatisk validering av regnskapsdata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Ingen data tilgjengelig for validering
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>
              {data.length} poster validert med {enabledRules.length} regler
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
          >
            Oppdater
          </Button>
        </div>
        
        {showSummary && (
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{summary.passed}</div>
              <div className="text-xs text-muted-foreground">Bestått</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{summary.failed}</div>
              <div className="text-xs text-muted-foreground">Feilet</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{summary.warnings}</div>
              <div className="text-xs text-muted-foreground">Advarsler</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.totalAffected}</div>
              <div className="text-xs text-muted-foreground">Påvirket</div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="summary">Sammendrag</TabsTrigger>
            <TabsTrigger value="details">Detaljer</TabsTrigger>
            <TabsTrigger value="actions">Handlinger</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {Object.entries(resultsByCategory).map(([category, results]) => (
                  <div key={category}>
                    <h4 className="font-medium mb-2 capitalize">{category}</h4>
                    <div className="space-y-2">
                      {results.map((result, index) => (
                        <div key={`${result.ruleId}-${index}`} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            <span className="text-sm">{result.message}</span>
                          </div>
                          <Badge variant={getStatusBadgeVariant(result.status)}>
                            {result.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <EnhancedDataTable
              widgetId={`${dataSourceId}-validation`}
              title="Valideringsresultater"
              fetchData={async () => validationResults}
              columns={[
                {
                  key: 'ruleId',
                  header: 'Regel',
                  accessor: 'ruleId',
                  format: (value) => {
                    const rule = validationRules.find(r => r.id === value);
                    return rule?.name || value;
                  }
                },
                {
                  key: 'status',
                  header: 'Status',
                  accessor: 'status',
                  format: (value) => (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(value)}
                      <Badge variant={getStatusBadgeVariant(value)}>
                        {value}
                      </Badge>
                    </div>
                  )
                },
                {
                  key: 'message',
                  header: 'Melding',
                  accessor: 'message'
                },
                {
                  key: 'affectedRecords',
                  header: 'Påvirket',
                  accessor: 'affectedRecords',
                  format: (value) => value || 0
                }
              ]}
              enablePagination={false}
              showSearch={false}
              pageSize={10}
            />
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <div className="space-y-4">
              {validationResults
                .filter(r => r.suggestedAction && r.status !== 'passed')
                .map((result, index) => (
                  <Alert key={index}>
                    {getStatusIcon(result.status)}
                    <AlertDescription>
                      <div className="font-medium mb-1">{result.message}</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {result.suggestedAction}
                      </div>
                      {result.affectedRecords && result.affectedRecords > 0 && (
                        <Button variant="outline" size="sm" className="mt-2">
                          Vis påvirkede poster ({result.affectedRecords})
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              
              {validationResults.filter(r => r.suggestedAction && r.status !== 'passed').length === 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ingen handlinger kreves. Alle valideringer har bestått eller er bare advarsler.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};