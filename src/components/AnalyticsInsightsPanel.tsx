import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  Users,
  Calendar
} from 'lucide-react';
import { analysisService } from '@/services/analysisService';

interface AnalyticsData {
  performanceMetrics: {
    averageProcessingTime: number;
    successRate: number;
    cacheHitRate: number;
    errorRate: number;
    totalAnalyses: number;
  };
  usageStats: {
    dailyAnalyses: Array<{ date: string; count: number; }>;
    topAnalysisTypes: Array<{ type: string; count: number; }>;
    userActivity: Array<{ hour: number; analyses: number; }>;
  };
  qualityMetrics: {
    aiConfidenceScores: Array<{ range: string; count: number; }>;
    controlTestResults: Array<{ test: string; passRate: number; }>;
    riskDistribution: Array<{ level: string; count: number; color: string; }>;
  };
  trends: {
    monthlyGrowth: Array<{ month: string; analyses: number; users: number; }>;
    improvementMetrics: Array<{ metric: string; improvement: number; }>;
  };
}

export function AnalyticsInsightsPanel() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Simuler datainnhenting - i praksis ville dette komme fra en analytics service
      const data: AnalyticsData = {
        performanceMetrics: {
          averageProcessingTime: 3.2,
          successRate: 97.8,
          cacheHitRate: 84.5,
          errorRate: 2.2,
          totalAnalyses: 1847
        },
        usageStats: {
          dailyAnalyses: generateDailyData(),
          topAnalysisTypes: [
            { type: 'Risiko analyse', count: 423 },
            { type: 'Kontroll tester', count: 387 },
            { type: 'AI analyse', count: 295 },
            { type: 'Transaksjonsflyt', count: 198 },
            { type: 'Sammendrag', count: 167 }
          ],
          userActivity: generateHourlyData()
        },
        qualityMetrics: {
          aiConfidenceScores: [
            { range: '90-100%', count: 145 },
            { range: '80-89%', count: 298 },
            { range: '70-79%', count: 187 },
            { range: '60-69%', count: 89 },
            { range: '<60%', count: 34 }
          ],
          controlTestResults: [
            { test: 'Kontroll summer', passRate: 98.5 },
            { test: 'Dubletter', passRate: 94.2 },
            { test: 'Dato validering', passRate: 99.1 },
            { test: 'Beløp konsistens', passRate: 96.7 },
            { test: 'Konto mapping', passRate: 92.3 }
          ],
          riskDistribution: [
            { level: 'Lav', count: 756, color: '#22c55e' },
            { level: 'Medium', count: 324, color: '#f59e0b' },
            { level: 'Høy', count: 89, color: '#ef4444' },
            { level: 'Kritisk', count: 12, color: '#dc2626' }
          ]
        },
        trends: {
          monthlyGrowth: generateMonthlyData(),
          improvementMetrics: [
            { metric: 'Prosesseringstid', improvement: -15.3 },
            { metric: 'Cache treff-rate', improvement: 12.7 },
            { metric: 'AI nøyaktighet', improvement: 8.9 },
            { metric: 'Bruker tilfredshet', improvement: 22.1 }
          ]
        }
      };
      
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDailyData = () => {
    const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toLocaleDateString('nb-NO'),
        count: Math.floor(Math.random() * 50) + 10
      };
    });
  };

  const generateHourlyData = () => {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      analyses: Math.floor(Math.random() * 30) + (hour >= 8 && hour <= 17 ? 20 : 5)
    }));
  };

  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun'];
    return months.map(month => ({
      month,
      analyses: Math.floor(Math.random() * 200) + 100,
      users: Math.floor(Math.random() * 50) + 20
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Innsikter</CardTitle>
          <CardDescription>Laster analytiske data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Tidsperiode Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Innsikter</h2>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range === '7d' ? '7 dager' : range === '30d' ? '30 dager' : '90 dager'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Analyser</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.performanceMetrics.totalAnalyses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% fra forrige periode
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suksessrate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.performanceMetrics.successRate}%</div>
            <Progress value={analyticsData.performanceMetrics.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gjennomsnittlig Tid</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.performanceMetrics.averageProcessingTime}s</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingDown className="h-3 w-3 mr-1" />
              15% forbedring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Treff-rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.performanceMetrics.cacheHitRate}%</div>
            <Progress value={analyticsData.performanceMetrics.cacheHitRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card>
        <CardContent>
          <Tabs defaultValue="usage" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="usage">Bruk</TabsTrigger>
              <TabsTrigger value="performance">Ytelse</TabsTrigger>
              <TabsTrigger value="quality">Kvalitet</TabsTrigger>
              <TabsTrigger value="trends">Trender</TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Daglige Analyser</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.usageStats.dailyAnalyses}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Top Analyse Typer</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.usageStats.topAnalysisTypes} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="type" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Brukeraktivitet (timer)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.usageStats.userActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="analyses" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Forbedringer (%)</h3>
                  <div className="space-y-4">
                    {analyticsData.trends.improvementMetrics.map((metric, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{metric.metric}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-bold ${metric.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {metric.improvement > 0 ? '+' : ''}{metric.improvement}%
                          </span>
                          {metric.improvement > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">AI Konfidens Fordeling</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.qualityMetrics.aiConfidenceScores}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ range, count, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.qualityMetrics.aiConfidenceScores.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${220 + index * 30}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Kontrolltest Resultater</h3>
                  <div className="space-y-3">
                    {analyticsData.qualityMetrics.controlTestResults.map((test, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{test.test}</span>
                          <span className="font-medium">{test.passRate}%</span>
                        </div>
                        <Progress value={test.passRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Månedlig Vekst</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.trends.monthlyGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="analyses" fill="#3b82f6" name="Analyser" />
                      <Bar dataKey="users" fill="#10b981" name="Brukere" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Risiko Fordeling</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.qualityMetrics.riskDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ level, count }) => `${level}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.qualityMetrics.riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Alerts and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Systemet kjører optimalt med {analyticsData.performanceMetrics.successRate}% suksessrate og {analyticsData.performanceMetrics.cacheHitRate}% cache treff-rate.
          </AlertDescription>
        </Alert>

        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            AI nøyaktighet har forbedret seg med 8.9% denne måneden takket være forbedrede treningsdata.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}