import React, { useState } from 'react';
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
  ResponsiveContainer
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
import DrillDownModal from './DrillDownModal';
import ExportControls from './ExportControls';
import AdvancedAnomalyDetection from './AdvancedAnomalyDetection';

interface PopulationInsightsProps {
  clientId: string;
  fiscalYear: number;
  selectedStandardNumbers: string[];
  excludedAccountNumbers: string[];
  versionId?: string;
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

const PopulationInsights: React.FC<PopulationInsightsProps> = ({
  clientId,
  fiscalYear,
  selectedStandardNumbers,
  excludedAccountNumbers,
  versionId,
  analysisLevel = 'account',
  onAnalysisLevelChange
}) => {
  const [selectedCounterAccounts, setSelectedCounterAccounts] = useState<string[]>([]);
  const [drillDownAccount, setDrillDownAccount] = useState<{
    accountNumber: string;
    accountName: string;
  } | null>(null);

  const { 
    data: analysisData, 
    isLoading, 
    error 
  } = usePopulationAnalysis(
    clientId,
    fiscalYear,
    selectedStandardNumbers,
    excludedAccountNumbers,
    versionId,
    analysisLevel
  );

  if (selectedStandardNumbers.length === 0) {
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Populasjonsanalyse
          </CardTitle>
          <CardDescription>Analyserer populasjonsdata...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-32 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
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

  const { counterAccountDistribution, transactionStatistics, riskIndicators } = analysisData;

  // Filter counter accounts based on selection
  const filteredCounterAccounts = selectedCounterAccounts.length > 0 
    ? counterAccountDistribution.filter(item => selectedCounterAccounts.includes(item.account_number))
    : counterAccountDistribution;

  // Prepare data for pie chart with click handling
  const pieData = filteredCounterAccounts.map((item, index) => ({
    name: `${item.account_number} ${item.account_name}`,
    value: item.percentage,
    amount: item.total_amount,
    count: item.transaction_count,
    color: CHART_COLORS[index % CHART_COLORS.length],
    account_number: item.account_number,
    account_name: item.account_name
  }));

  // Prepare data for bar chart (top counter accounts)
  const barData = filteredCounterAccounts.slice(0, 5).map(item => ({
    account: `${item.account_number}`,
    name: item.account_name.length > 20 ? item.account_name.substring(0, 17) + '...' : item.account_name,
    amount: item.total_amount,
    count: item.transaction_count,
    account_number: item.account_number,
    full_name: item.account_name
  }));

  const handlePieClick = (data: any) => {
    setDrillDownAccount({
      accountNumber: data.account_number,
      accountName: data.account_name
    });
  };

  const handleCounterAccountToggle = (accountNumber: string) => {
    setSelectedCounterAccounts(prev => 
      prev.includes(accountNumber) 
        ? prev.filter(acc => acc !== accountNumber)
        : [...prev, accountNumber]
    );
  };

  const clearFilters = () => {
    setSelectedCounterAccounts([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
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
                {formatNumber(transactionStatistics.totalTransactions)}
              </div>
              <div className="text-sm text-muted-foreground">Transaksjoner</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(transactionStatistics.averageAmount)}
              </div>
              <div className="text-sm text-muted-foreground">Gjennomsnitt</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(transactionStatistics.medianAmount)}
              </div>
              <div className="text-sm text-muted-foreground">Median</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-destructive">
                {riskIndicators.length}
              </div>
              <div className="text-sm text-muted-foreground">Risikoindikatorer</div>
            </div>
          </div>

          {/* Additional Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-lg font-semibold">{formatCurrency(transactionStatistics.minAmount)}</div>
              <div className="text-xs text-muted-foreground">Minimum</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{formatCurrency(transactionStatistics.q1)}</div>
              <div className="text-xs text-muted-foreground">Q1 (25%)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{formatCurrency(transactionStatistics.q3)}</div>
              <div className="text-xs text-muted-foreground">Q3 (75%)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{formatCurrency(transactionStatistics.maxAmount)}</div>
              <div className="text-xs text-muted-foreground">Maksimum</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Counter Account Distribution */}
      {counterAccountDistribution.length > 0 && (
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
                Klikk på segmenter for drill-down analyse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        onClick={handlePieClick}
                        style={{ cursor: 'pointer' }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke={selectedCounterAccounts.includes(entry.account_number) ? '#000' : 'none'}
                            strokeWidth={selectedCounterAccounts.includes(entry.account_number) ? 2 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any, name: any, props: any) => [
                          `${value.toFixed(1)}% (${formatCurrency(props.payload.amount)})`,
                          'Andel'
                        ]}
                      />
                    </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Interactive Legend */}
              <div className="mt-4 space-y-2">
                {pieData.slice(0, 5).map((item, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-colors ${
                      selectedCounterAccounts.includes(item.account_number) 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleCounterAccountToggle(item.account_number)}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-mono text-xs">{item.account_number}</span>
                      <span className="truncate">{item.account_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.value.toFixed(1)}%</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrillDownAccount({
                            accountNumber: item.account_number,
                            accountName: item.account_name
                          });
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Transaksjonsvolum
              </CardTitle>
              <CardDescription>
                Antall transaksjoner per motkonto (topp 5)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="account" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => [
                        formatNumber(value),
                        'Transaksjoner'
                      ]}
                      labelFormatter={(label) => `Konto ${label}`}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Indicators */}
      {riskIndicators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Risikoindikatorer
            </CardTitle>
            <CardDescription>
              Automatisk identifiserte avvik og potensielle risikoområder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {riskIndicators.map((indicator, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        indicator.risk_score >= 0.7 ? 'bg-destructive' :
                        indicator.risk_score >= 0.5 ? 'bg-warning' : 'bg-muted'
                      }`} />
                      <div>
                        <div className="font-medium text-sm">{indicator.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Konto: {indicator.account_number}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={indicator.risk_score >= 0.7 ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {indicator.type === 'large_transaction' && 'Stor transaksjon'}
                      {indicator.type === 'round_amount' && 'Rundt beløp'}
                      {indicator.type === 'unusual_counter_account' && 'Uvanlig motkonto'}
                      {indicator.type === 'late_posting' && 'Sen postering'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Outliers */}
      {transactionStatistics.outliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Statistiske avvikere
            </CardTitle>
            <CardDescription>
              Transaksjoner som ligger utenfor normal variasjon (IQR ± 1.5)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactionStatistics.outliers.slice(0, 10).map((outlier, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{formatCurrency(outlier.amount)}</div>
                    <div className="text-sm text-muted-foreground">
                      {outlier.account_number} • {outlier.transaction_date} • {outlier.description}
                    </div>
                  </div>
                  <Badge variant="outline">Avviker</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Anomaly Detection */}
      <AdvancedAnomalyDetection
        clientId={clientId}
        fiscalYear={fiscalYear}
        selectedAccountNumbers={selectedStandardNumbers.length > 0 ? 
          Array.from(new Set(counterAccountDistribution.flatMap(item => [item.account_number])))
          : []
        }
        versionId={versionId}
      />

      {/* Drill Down Modal */}
      <DrillDownModal
        isOpen={!!drillDownAccount}
        onOpenChange={() => setDrillDownAccount(null)}
        clientId={clientId}
        fiscalYear={fiscalYear}
        selectedAccountNumbers={selectedStandardNumbers.length > 0 ? 
          Array.from(new Set(counterAccountDistribution.flatMap(item => [item.account_number])))
          : []
        }
        counterAccountNumber={drillDownAccount?.accountNumber || ''}
        counterAccountName={drillDownAccount?.accountName || ''}
        versionId={versionId}
      />
    </div>
  );
};

export default PopulationInsights;