import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Eye, 
  Calculator, 
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  FilterX
} from 'lucide-react';
import { usePopulationAnalysis, PopulationAnalysisData } from '@/hooks/usePopulationAnalysis';
import { useDebounce } from '@/hooks/useDebounce';
import DrillDownModal from './DrillDownModal';
import ExportControls from './ExportControls';
import AdvancedAnomalyDetection from './AdvancedAnomalyDetection';
import ErrorBoundary from '@/components/ui/error-boundary';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { VirtualScrollArea } from '@/components/ui/virtual-scroll-area';

interface PopulationInsightsProps {
  clientId: string;
  fiscalYear: number;
  selectedStandardNumbers: string[];
  excludedAccountNumbers: string[];
  versionString?: string;
  analysisLevel?: 'account' | 'statement_line';
  onAnalysisLevelChange?: (level: 'account' | 'statement_line') => void;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00C49F',
  '#FFBB28',
  '#FF8042'
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('nb-NO').format(num);
};

const generateColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

const PopulationInsights: React.FC<PopulationInsightsProps> = React.memo(({ 
  clientId, 
  fiscalYear, 
  selectedStandardNumbers, 
  excludedAccountNumbers, 
  versionString, 
  analysisLevel = 'account', 
  onAnalysisLevelChange 
}) => {
  // Always call all hooks first - this prevents React error #310
  const [selectedCounterAccounts, setSelectedCounterAccounts] = useState<string[]>([]);
  const [drillDownAccount, setDrillDownAccount] = useState<{
    accountNumber: string;
    accountName: string;
  } | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [selectedCounterAccount, setSelectedCounterAccount] = useState<{
    counterAccount: string;
    counterAccountName: string;
  } | null>(null);

  // Debounce inputs to prevent race conditions - now consistent with parent
  const debouncedSelectedStandardNumbers = useDebounce(selectedStandardNumbers, 200);
  const debouncedExcludedAccountNumbers = useDebounce(excludedAccountNumbers, 200);

  const { 
    data: analysisData, 
    isLoading, 
    error 
  } = usePopulationAnalysis(
    clientId,
    fiscalYear,
    debouncedSelectedStandardNumbers,
    debouncedExcludedAccountNumbers,
    versionString
  );

  // Handle early returns after all hooks are called
  if (debouncedSelectedStandardNumbers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Populasjonsanalyse
          </CardTitle>
          <CardDescription>
            Velg regnskapslinjer for å se deskriptiv analyse av populasjonen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ingen regnskapslinjer valgt</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <LoadingSkeleton 
        title="Populasjonsanalyse"
        description="Analyserer populasjonsdata og genererer innsikt..."
        showCharts={true}
        showStats={true}
        rows={4}
      />
    );
  }

  if (error || !analysisData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Feil ved analyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Kunne ikke analysere populasjonsdata. {error?.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasData = analysisData?.counterAccountAnalysis && analysisData?.basicStatistics && analysisData?.anomalyDetection?.anomalies;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Populasjonsanalyse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Ingen data tilgjengelig for analyse.</p>
        </CardContent>
      </Card>
    );
  }

  // Filter counter accounts based on selection
  const filteredCounterAccounts = selectedCounterAccounts.length > 0 
    ? analysisData.counterAccountAnalysis.filter((item) => selectedCounterAccounts.includes(item.counterAccount))
    : analysisData.counterAccountAnalysis;

  // Prepare data for pie chart with click handling
  const pieData = filteredCounterAccounts.slice(0, 5).map((item, index) => ({
    name: item.counterAccountName || item.counterAccount,
    value: item.totalAmount,
    account_number: item.counterAccount,
    color: generateColor(index)
  }));

  // Prepare data for bar chart (top counter accounts)
  const barData = filteredCounterAccounts.slice(0, 10).map((item) => ({
    name: item.counterAccountName?.length > 20 
      ? item.counterAccountName.substring(0, 20) + '...' 
      : item.counterAccountName,
    value: item.transactionCount,
    full_name: item.counterAccountName
  }));

  const handlePieClick = useCallback((data: any) => {
    setSelectedCounterAccount({
      counterAccount: data.account_number,
      counterAccountName: data.name
    });
    setIsDrillDownOpen(true);
  }, []);

  const handleCounterAccountToggle = useCallback((accountNumber: string) => {
    setSelectedCounterAccounts(prev => 
      prev.includes(accountNumber) 
        ? prev.filter(acc => acc !== accountNumber)
        : [...prev, accountNumber]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCounterAccounts([]);
  }, []);

  // Keyboard navigation for charts
  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  const renderPieChart = () => {
    if (pieData.length === 0) return null;

    return (
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          onClick={handlePieClick}
          style={{ cursor: 'pointer' }}
        >
          {pieData.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={(entry as any).color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: any) => [
            `${Math.abs(Number(value)).toLocaleString('no-NO', { 
              style: 'currency', 
              currency: 'NOK' 
            })}`, 
            'Beløp'
          ]}
        />
        <Legend 
          formatter={(value: string, entry: any) => (
            <span style={{ color: entry.color, fontSize: '12px' }}>
              {entry.payload?.full_name || value}
            </span>
          )}
        />
      </PieChart>
    );
  };

  const renderRiskIndicators = () => {
    if (!analysisData?.anomalyDetection?.anomalies) return null;

    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {analysisData.anomalyDetection.anomalies.map((item, index) => {
          const severity = item.severity;
          const bgColor = severity === 'high' ? 'bg-red-50 border-red-200' : 
                          severity === 'medium' ? 'bg-yellow-50 border-yellow-200' : 
                          'bg-gray-50 border-gray-200';
          
          return (
            <div key={`${item.accountNumber}-${index}`} className={`p-3 rounded-lg border ${bgColor}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{item.description}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Konto: {item.accountNumber}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    severity === 'high' ? 'bg-red-100 text-red-800' :
                    severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {severity === 'high' ? 'Høy' : severity === 'medium' ? 'Medium' : 'Lav'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOutlierCards = () => {
    return analysisData?.outlierDetection?.outliers?.slice(0, 3).map((outlier, index) => (
      <div key={index} className="p-3 border rounded-lg bg-blue-50">
        <div className="text-xs text-gray-500">Konto: {outlier.accountNumber} - {outlier.accountName}</div>
        <div className="text-lg font-semibold text-blue-600">
          {Math.abs(outlier.closingBalance).toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
        </div>
        <div className="text-xs text-gray-400">
          {outlier.outlierType === 'high' ? 'Uvanlig høy saldo' : 'Uvanlig lav saldo'}
        </div>
      </div>
    ));
  };

  const renderStatisticsCards = () => {
    return (
      <>
        <div className="p-3 border rounded-lg bg-green-50">
          <div className="font-medium text-green-600">
            Gjennomsnitt: {Math.abs(analysisData.basicStatistics.averageBalance).toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
          </div>
          <div className="text-sm text-gray-600">
            Median: {Math.abs(analysisData.basicStatistics.medianBalance).toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
          </div>
        </div>
        
        <div className="p-3 border rounded-lg bg-purple-50">
          <div className="font-medium text-purple-600">
            {analysisData.counterAccountAnalysis.length} motkontoer
          </div>
          <div className="text-sm text-gray-600">
            Mest aktive: {analysisData.counterAccountAnalysis[0]?.counterAccountName || 'Ingen'}
          </div>
        </div>
        
        <div className="p-3 border rounded-lg bg-orange-50">
          <div className="font-medium text-orange-600">
            Totalt: {analysisData.basicStatistics.totalAccounts} kontoer
          </div>
          <div className="text-sm text-gray-600">
            Største: {Math.abs(analysisData.basicStatistics.maxBalance).toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
          </div>
        </div>
      </>
    );
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6" role="main" aria-label="Populasjonsanalyse">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  Populasjonsanalyse
                </CardTitle>
                <CardDescription>
                  Deskriptiv analyse og visualisering av valgte populasjon
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <ExportControls 
                  analysisData={analysisData} 
                  fiscalYear={fiscalYear}
                />
                {selectedCounterAccounts.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <FilterX className="h-4 w-4 mr-2" />
                    Fjern filter
                  </Button>
                )}
                {onAnalysisLevelChange && (
                  <>
                    <Button
                      variant={analysisLevel === 'account' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onAnalysisLevelChange('account')}
                    >
                      Kontonivå
                    </Button>
                    <Button
                      variant={analysisLevel === 'statement_line' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onAnalysisLevelChange('statement_line')}
                    >
                      Regnskapslinje
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Key Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {formatNumber(analysisData.basicStatistics.totalAccounts)}
                </div>
                <div className="text-sm text-muted-foreground">Kontoer</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(analysisData.basicStatistics.averageBalance)}
                </div>
                <div className="text-sm text-muted-foreground">Gjennomsnitt</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(analysisData.basicStatistics.medianBalance)}
                </div>
                <div className="text-sm text-muted-foreground">Median</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-destructive">
                  {analysisData.anomalyDetection.anomalies.length}
                </div>
                <div className="text-sm text-muted-foreground">Anomalier</div>
              </div>
            </div>

            {/* Additional Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-lg font-semibold">{formatCurrency(analysisData.basicStatistics.minBalance)}</div>
                <div className="text-xs text-muted-foreground">Minimum</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{formatCurrency(analysisData.basicStatistics.q1)}</div>
                <div className="text-xs text-muted-foreground">Q1 (25%)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{formatCurrency(analysisData.basicStatistics.q3)}</div>
                <div className="text-xs text-muted-foreground">Q3 (75%)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{formatCurrency(analysisData.basicStatistics.maxBalance)}</div>
                <div className="text-xs text-muted-foreground">Maksimum</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Counter Account Distribution - Always rendered to avoid hook ordering issues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4" />
                Motkontofordeling
                {selectedCounterAccounts.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    <Filter className="h-3 w-3 mr-1" />
                    {selectedCounterAccounts.length} filtrert
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {analysisData.counterAccountAnalysis.length > 0 
                  ? "Klikk på segmenter for drill-down analyse"
                  : "Venter på analysedata..."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisData.counterAccountAnalysis.length > 0 ? (
                <>
                   <div 
                     className="h-64" 
                     role="img" 
                     aria-label="Kakediagram som viser motkontofordeling. Klikk på segmenter for detaljert analyse."
                   >
                    <ResponsiveContainer width="100%" height="100%">
                      {renderPieChart()}
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Counter Account Filter Controls */}
                  {selectedCounterAccounts.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Filtrerer på {selectedCounterAccounts.length} motkonto(er)
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearFilters}
                          className="flex items-center gap-1"
                        >
                          <FilterX className="h-3 w-3" />
                          Fjern filter
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChartIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Ingen motkontodata tilgjengelig</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Transaksjonsvolum
              </CardTitle>
              <CardDescription>
                {analysisData.counterAccountAnalysis.length > 0 
                  ? "Antall transaksjoner per motkonto (topp 10)"
                  : "Venter på analysedata..."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisData.counterAccountAnalysis.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any) => [
                          formatNumber(value),
                          'Transaksjoner'
                        ]}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Ingen transaksjonsdata tilgjengelig</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Risk Indicators - Always rendered to avoid hook ordering issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Anomalier og avvik
            </CardTitle>
            <CardDescription>
              {analysisData.anomalyDetection.anomalies.length > 0 
                ? "Automatisk identifiserte avvik og potensielle risikoområder"
                : "Ingen anomalier funnet"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysisData.anomalyDetection.anomalies.length > 0 ? (
              renderRiskIndicators()
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ingen anomalier funnet i populasjonen</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderOutlierCards()}
          {renderStatisticsCards()}
        </div>

        <AdvancedAnomalyDetection
          clientId={clientId}
          fiscalYear={fiscalYear}
          selectedAccountNumbers={analysisData.accounts.map(acc => acc.account_number)}
          versionString={versionString}
        />

        {/* Drill-down modal for detailed transaction analysis */}
        <DrillDownModal
          isOpen={isDrillDownOpen}
          onOpenChange={setIsDrillDownOpen}
          clientId={clientId}
          fiscalYear={fiscalYear}  
          selectedAccountNumbers={analysisData.accounts.map(acc => acc.account_number)}
          counterAccountNumber={selectedCounterAccount?.counterAccount || ''}
          counterAccountName={selectedCounterAccount?.counterAccountName || ''}
          versionString={versionString}
        />
      </div>
    </ErrorBoundary>
  );
});

export default PopulationInsights;