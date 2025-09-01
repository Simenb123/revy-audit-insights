import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, BarChart3, PieChart, Clock } from 'lucide-react';
import { PopulationAnalysisData } from '@/hooks/usePopulationAnalysis';
import { formatCurrency, formatNumber } from '@/services/sampling/utils';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, Pie } from 'recharts';

interface PopulationAnalysisSectionProps {
  analysisData: PopulationAnalysisData | null;
  excludedAccountNumbers: string[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

const PopulationAnalysisSection: React.FC<PopulationAnalysisSectionProps> = ({ 
  analysisData, 
  excludedAccountNumbers 
}) => {
  // Memoize counter account data to prevent re-renders
  const counterAccountData = useMemo(() => 
    analysisData?.counterAccountAnalysis?.slice(0, 8).map((ca, index) => ({
      name: ca.counterAccount,
      fullName: ca.counterAccountName,
      value: ca.transactionCount,
      amount: ca.totalAmount,
      percentage: ca.percentage,
      fill: COLORS[index % COLORS.length]
    })) || [],
    [analysisData?.counterAccountAnalysis?.length]
  );

  // Memoize time series data to prevent re-renders
  const timeSeriesData = useMemo(() => 
    analysisData?.timeSeriesAnalysis?.monthlyData?.map(ts => ({
      month: ts.month,
      transaksjoner: ts.transactionCount,
      beløp: ts.totalAmount / 1000 // Show in thousands
    })) || [],
    [analysisData?.timeSeriesAnalysis?.monthlyData?.length]
  );

  // Memoize outliers data to prevent re-renders
  const { outliers, highOutliers, lowOutliers } = useMemo(() => {
    const allOutliers = analysisData?.outlierDetection?.outliers || [];
    return {
      outliers: allOutliers,
      highOutliers: allOutliers.filter(o => o.outlierType === 'high').slice(0, 5),
      lowOutliers: allOutliers.filter(o => o.outlierType === 'low').slice(0, 5)
    };
  }, [analysisData?.outlierDetection?.outliers?.length]);

  // Memoize anomalies data to prevent re-renders
  const { anomalies, highAnomalies, mediumAnomalies } = useMemo(() => {
    const allAnomalies = analysisData?.anomalyDetection?.anomalies || [];
    return {
      anomalies: allAnomalies,
      highAnomalies: allAnomalies.filter(a => a.severity === 'high'),
      mediumAnomalies: allAnomalies.filter(a => a.severity === 'medium')
    };
  }, [analysisData?.anomalyDetection?.anomalies?.length]);

  // Always render component, but show placeholder if no data - prevents React error #310
  if (!analysisData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-muted-foreground">Populasjonsanalyse</h3>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Velg populasjon for å starte analysen</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Populasjonsanalyse</h3>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="counteraccounts">Motkontoer</TabsTrigger>
          <TabsTrigger value="outliers">Outliers</TabsTrigger>
          <TabsTrigger value="trends">Trender</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nøkkelinnsikt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {highAnomalies.length > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{highAnomalies.length} høyrisiko anomali(er)</span>
                  </div>
                )}
                
                {outliers.length > 0 && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">{outliers.length} outlier(s) identifisert</span>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Trend: <span className="font-medium capitalize">{analysisData.timeSeriesAnalysis?.trend || 'Ingen data'}</span>
                </div>

                <div className="text-sm text-muted-foreground">
                  Sesongvariasjoner: <span className="font-medium">{analysisData.timeSeriesAnalysis?.seasonality === 'detected' ? 'Ja' : 'Nei'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Counter Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Topp motkontoer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {counterAccountData.slice(0, 5).map((ca, index) => (
                    <div key={ca.name} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: ca.fill }}
                        />
                        <span className="text-sm font-medium">{ca.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{ca.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="counteraccounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Fordeling av motkontoer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {counterAccountData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={counterAccountData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {counterAccountData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${value} transaksjoner (${props.payload.percentage.toFixed(1)}%)`,
                            'Antall'
                          ]}
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Detaljert oversikt</h4>
                    {counterAccountData.map((ca) => (
                      <div key={ca.name} className="border rounded p-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{ca.name}</span>
                          <Badge variant="secondary">{ca.percentage.toFixed(1)}%</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {ca.fullName}
                        </div>
                        <div className="text-sm">
                          {formatNumber(ca.value)} transaksjoner • {formatCurrency(ca.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Ingen motkontodata tilgjengelig
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outliers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* High Outliers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-600">Høye outliers</CardTitle>
              </CardHeader>
              <CardContent>
                {highOutliers.length > 0 ? (
                  <div className="space-y-2">
                    {highOutliers.map((outlier) => (
                      <div key={outlier.accountNumber} className="border rounded p-2">
                        <div className="font-medium">{outlier.accountNumber}</div>
                        <div className="text-sm text-muted-foreground">{outlier.accountName}</div>
                        <div className="text-sm">
                          {formatCurrency(outlier.closingBalance)}
                          <span className="text-red-600 ml-2">
                            (Z: {outlier.deviationScore.toFixed(2)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">Ingen høye outliers funnet</div>
                )}
              </CardContent>
            </Card>

            {/* Low Outliers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-blue-600">Lave outliers</CardTitle>
              </CardHeader>
              <CardContent>
                {lowOutliers.length > 0 ? (
                  <div className="space-y-2">
                    {lowOutliers.map((outlier) => (
                      <div key={outlier.accountNumber} className="border rounded p-2">
                        <div className="font-medium">{outlier.accountNumber}</div>
                        <div className="text-sm text-muted-foreground">{outlier.accountName}</div>
                        <div className="text-sm">
                          {formatCurrency(outlier.closingBalance)}
                          <span className="text-blue-600 ml-2">
                            (Z: {outlier.deviationScore.toFixed(2)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">Ingen lave outliers funnet</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Anomalier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {anomalies.map((anomaly, index) => (
                    <div 
                      key={`${anomaly.accountNumber}-${index}`} 
                      className={`border rounded p-3 ${
                        anomaly.severity === 'high' ? 'border-red-200 bg-red-50' :
                        anomaly.severity === 'medium' ? 'border-amber-200 bg-amber-50' :
                        'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{anomaly.accountNumber} - {anomaly.accountName}</div>
                          <div className="text-sm text-muted-foreground mt-1">{anomaly.description}</div>
                        </div>
                        <Badge 
                          variant={anomaly.severity === 'high' ? 'destructive' : 
                                  anomaly.severity === 'medium' ? 'default' : 'secondary'}
                        >
                          {anomaly.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Månedlige trender
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeSeriesData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="transaksjoner" fill="hsl(var(--primary))" name="Transaksjoner" />
                      <Line yAxisId="right" type="monotone" dataKey="beløp" stroke="hsl(var(--secondary))" name="Beløp (tusen)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Ingen tidsseriedata tilgjengelig
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PopulationAnalysisSection;