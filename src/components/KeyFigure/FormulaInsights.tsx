import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Info,
  Lightbulb,
  BarChart3,
  PieChart,
  Activity,
  Target,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface FormulaInsight {
  type: 'trend' | 'benchmark' | 'anomaly' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  value?: number;
  change?: number;
  benchmark?: number;
  suggestion?: string;
}

interface FormulaInsightsProps {
  formula: string;
  formulaName: string;
  category: string;
  values?: Array<{ period: string; value: number }>;
  clientId?: string;
  className?: string;
}

const sampleData = [
  { period: '2023-Q1', value: 1.8, benchmark: 2.0 },
  { period: '2023-Q2', value: 1.6, benchmark: 2.0 },
  { period: '2023-Q3', value: 1.4, benchmark: 2.0 },
  { period: '2023-Q4', value: 1.2, benchmark: 2.0 },
  { period: '2024-Q1', value: 1.3, benchmark: 2.0 },
];

const industryBenchmarks = {
  'profitability': {
    'Bruttomargin %': { good: 30, warning: 20, critical: 10 },
    'Driftsmargin %': { good: 10, warning: 5, critical: 0 },
    'Totalrentabilitet %': { good: 15, warning: 8, critical: 3 }
  },
  'liquidity': {
    'Likviditetsgrad 1': { good: 2.0, warning: 1.2, critical: 1.0 },
    'Likviditetsgrad 2': { good: 1.0, warning: 0.7, critical: 0.5 }
  },
  'efficiency': {
    'Lageromløpshastighet': { good: 12, warning: 6, critical: 3 },
    'Kundefordringer omløp': { good: 12, warning: 8, critical: 4 }
  },
  'leverage': {
    'Egenkapitalandel %': { good: 40, warning: 20, critical: 10 },
    'Gjeldsgrad': { good: 1.5, warning: 3.0, critical: 5.0 }
  }
};

export function FormulaInsights({
  formula,
  formulaName,
  category,
  values = sampleData,
  clientId,
  className
}: FormulaInsightsProps) {
  const [insights, setInsights] = useState<FormulaInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    generateInsights();
  }, [formula, formulaName, category, values]);

  const generateInsights = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newInsights: FormulaInsight[] = [];
    const currentValue = values[values.length - 1]?.value || 0;
    const previousValue = values[values.length - 2]?.value || 0;
    const change = ((currentValue - previousValue) / previousValue) * 100;
    
    // Trend analysis
    if (Math.abs(change) > 5) {
      newInsights.push({
        type: 'trend',
        severity: change < -15 ? 'critical' : change < -5 ? 'warning' : 'info',
        title: change > 0 ? 'Positiv trend' : 'Negativ trend',
        description: `${formulaName} har ${change > 0 ? 'økt' : 'falt'} med ${Math.abs(change).toFixed(1)}% siste periode`,
        value: currentValue,
        change: change,
        suggestion: change < 0 ? 'Følg opp med tiltak for å forbedre denne trenden' : 'Hold kursen - trenden er positiv'
      });
    }

    // Benchmark comparison
    const categoryBenchmarks = industryBenchmarks[category as keyof typeof industryBenchmarks];
    const benchmark: { good: number; warning: number; critical: number } | undefined = 
      categoryBenchmarks ? categoryBenchmarks[formulaName as keyof typeof categoryBenchmarks] : undefined;
    if (benchmark) {
      let severity: 'info' | 'warning' | 'critical' = 'info';
      let status = 'god';
      
      if (category === 'leverage' && formulaName === 'Gjeldsgrad') {
        // For gjeldsgrad er lavere bedre
        if (currentValue > benchmark.critical) severity = 'critical';
        else if (currentValue > benchmark.warning) severity = 'warning';
        status = currentValue <= benchmark.good ? 'god' : currentValue <= benchmark.warning ? 'akseptabel' : 'svak';
      } else {
        // For de fleste nøkkeltall er høyere bedre
        if (currentValue < benchmark.critical) severity = 'critical';
        else if (currentValue < benchmark.warning) severity = 'warning';
        status = currentValue >= benchmark.good ? 'god' : currentValue >= benchmark.warning ? 'akseptabel' : 'svak';
      }

      newInsights.push({
        type: 'benchmark',
        severity,
        title: 'Bransjesammenligning',
        description: `Din verdi (${currentValue.toFixed(2)}) er ${status} sammenlignet med bransjen`,
        value: currentValue,
        benchmark: benchmark.good,
        suggestion: severity !== 'info' ? 'Vurder tiltak for å forbedre denne verdien' : 'Bra resultat - fortsett det gode arbeidet'
      });
    }

    // Anomaly detection
    const values_only = values.map(v => v.value);
    const mean = values_only.reduce((a, b) => a + b, 0) / values_only.length;
    const variance = values_only.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values_only.length;
    const stdDev = Math.sqrt(variance);
    
    if (Math.abs(currentValue - mean) > 2 * stdDev) {
      newInsights.push({
        type: 'anomaly',
        severity: 'warning',
        title: 'Unormal avvik',
        description: `Nåværende verdi avviker betydelig fra historisk gjennomsnitt (${mean.toFixed(2)})`,
        value: currentValue,
        suggestion: 'Undersøk årsaken til dette avviket'
      });
    }

    // Formula-specific recommendations
    if (formulaName.includes('Likviditetsgrad') && currentValue < 1.0) {
      newInsights.push({
        type: 'recommendation',
        severity: 'critical',
        title: 'Likviditetsproblem',
        description: 'Likviditetsgraden er under 1.0, som indikerer potensielle betalingsproblemer',
        value: currentValue,
        suggestion: 'Vurder tiltak som økt kredittramme, bedre innkreving eller reduserte kostnader'
      });
    }

    if (formulaName.includes('margin') && currentValue < 5) {
      newInsights.push({
        type: 'recommendation',
        severity: 'warning',
        title: 'Lav marginutvikling',
        description: 'Marginen er lav og kan påvirke lønnsomheten negativt',
        value: currentValue,
        suggestion: 'Analyser kostnadsstrukturen og vurder prisjusteringer eller kostnadsreduksjoner'
      });
    }

    setInsights(newInsights);
    setIsAnalyzing(false);
  };

  const getInsightIcon = (type: string, severity: string) => {
    if (type === 'trend') {
      return severity === 'critical' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />;
    }
    if (type === 'benchmark') return <BarChart3 className="h-4 w-4" />;
    if (type === 'anomaly') return <AlertTriangle className="h-4 w-4" />;
    if (type === 'recommendation') return <Lightbulb className="h-4 w-4" />;
    return <Info className="h-4 w-4" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Formel-innsikt: {formulaName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateInsights}
              disabled={isAnalyzing}
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trend Chart */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Utvikling over tid</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={values}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      typeof value === 'number' ? value.toFixed(2) : value,
                      name === 'value' ? formulaName : 'Benchmark'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmark" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights List */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Analyse og anbefalinger</h4>
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Analyserer data...
              </div>
            ) : insights.length > 0 ? (
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <Alert key={index} variant={getSeverityColor(insight.severity) as any}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getInsightIcon(insight.type, insight.severity)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <strong>{insight.title}</strong>
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                        </div>
                        <AlertDescription>{insight.description}</AlertDescription>
                        {insight.suggestion && (
                          <div className="text-sm bg-muted/50 p-2 rounded">
                            <strong>Anbefaling:</strong> {insight.suggestion}
                          </div>
                        )}
                        {insight.value !== undefined && (
                          <div className="flex gap-4 text-sm">
                            <span><strong>Verdi:</strong> {insight.value.toFixed(2)}</span>
                            {insight.change !== undefined && (
                              <span className={insight.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                <strong>Endring:</strong> {insight.change >= 0 ? '+' : ''}{insight.change.toFixed(1)}%
                              </span>
                            )}
                            {insight.benchmark !== undefined && (
                              <span><strong>Benchmark:</strong> {insight.benchmark.toFixed(2)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Ingen spesielle innsikter funnet for denne formelen
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {values[values.length - 1]?.value.toFixed(2) || '0.00'}
              </div>
              <div className="text-xs text-muted-foreground">Nåværende verdi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {values.length > 1 ? 
                  (((values[values.length - 1]?.value - values[values.length - 2]?.value) / values[values.length - 2]?.value) * 100).toFixed(1) + '%'
                  : '0.0%'
                }
              </div>
              <div className="text-xs text-muted-foreground">Endring</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {(values.reduce((sum, v) => sum + v.value, 0) / values.length).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Gjennomsnitt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {insights.filter(i => i.severity === 'critical').length + insights.filter(i => i.severity === 'warning').length}
              </div>
              <div className="text-xs text-muted-foreground">Varsler</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}